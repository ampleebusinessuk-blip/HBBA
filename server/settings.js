// Workspace settings an administrator can change from the UI, including
// integration credentials.
//
// Three rules hold throughout:
//
//   1. An environment variable always wins. A platform secret store stays
//      authoritative where one is used, and nothing an admin types can quietly
//      replace a key the deployment was configured with.
//   2. Secrets are encrypted at rest with AES-256-GCM. Without SECRETS_KEY the
//      app refuses to store them rather than writing plaintext.
//   3. Secrets are never returned. Reads give a masked hint — `re_••••a91f` —
//      which is enough to recognise a key and useless to anyone who steals it.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { query } from './db.js';

/** Integration credentials an admin may manage from Settings. */
export const MANAGED_SECRETS = [
  'EMAIL_TRANSPORT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_SECURE',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'EVENTBRITE_TOKEN',
  'EVENTBRITE_ORG_ID',
  'CRON_SECRET'
];

/** Plain workspace settings, safe to read back in full. */
export const BUSINESS_KEYS = [
  'business.name',
  'business.address',
  'business.email',
  'business.phone',
  'business.registration_no',
  'business.vat_no',
  'business.logo_url',
  'business.invoice_prefix',
  'business.invoice_footer'
];

// EMAIL_FROM is not really a secret, but it belongs with the email credential.
// Hostnames, ports and usernames are configuration, not credentials; only the
// password and API keys are encrypted.
const NON_SECRET_MANAGED = new Set([
  'EMAIL_FROM', 'EVENTBRITE_ORG_ID', 'EMAIL_TRANSPORT',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_SECURE'
]);

let cache = { at: 0, values: new Map() };
const CACHE_MS = 30_000;

function encryptionKey() {
  const raw = process.env.SECRETS_KEY;
  if (!raw) return null;
  // Accept any passphrase; scrypt gives the 32 bytes AES-256 needs.
  return scryptSync(raw, 'hbba-settings', 32);
}

export function secretsConfigured() {
  return Boolean(process.env.SECRETS_KEY);
}

function encrypt(plain) {
  const key = encryptionKey();
  if (!key) throw new Error('SECRETS_KEY is not set, so secrets cannot be stored');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${enc.toString('base64url')}`;
}

function decrypt(stored) {
  const key = encryptionKey();
  if (!key || typeof stored !== 'string' || !stored.startsWith('v1.')) return null;
  try {
    const [, iv, tag, payload] = stored.split('.');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(payload, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    // Wrong key, or the row was written by a deployment with a different one.
    return null;
  }
}

/** Show enough to recognise a credential, never enough to use it. */
export function maskSecret(value) {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 8) return '••••';
  return `${text.slice(0, 3)}••••${text.slice(-4)}`;
}

async function loadCache(force = false) {
  if (!force && Date.now() - cache.at < CACHE_MS) return cache.values;
  try {
    const { rows } = await query('SELECT key, value, is_secret FROM app_settings');
    const values = new Map();
    for (const row of rows) {
      values.set(row.key, row.is_secret ? decrypt(row.value) : row.value);
    }
    cache = { at: Date.now(), values };
  } catch {
    // A deployment whose migrations have not run yet still has to boot.
    cache = { at: Date.now(), values: cache.values };
  }
  return cache.values;
}

/** Warm the cache so the synchronous resolvers below have data to read. */
export async function refreshSettings() {
  return loadCache(true);
}

/**
 * Refresh only when stale. Called once per request so a credential saved on one
 * instance reaches the others within the cache window, without a database round
 * trip on every call.
 */
export async function ensureSettingsLoaded() {
  return loadCache(false);
}

/**
 * Resolve a configuration value: environment first, then the stored setting.
 * Synchronous on purpose — callers such as emailConfigured() are used inside
 * templates and request handlers that cannot await.
 */
export function resolve(key) {
  const fromEnv = process.env[key];
  if (fromEnv) return fromEnv;
  return cache.values.get(key) || null;
}

export function isEnvManaged(key) {
  return Boolean(process.env[key]);
}

/** Every managed value with its source, masked where it is a secret. */
export async function settingsOverview() {
  await loadCache();
  const integrations = MANAGED_SECRETS.map((key) => {
    const envManaged = isEnvManaged(key);
    const value = resolve(key);
    const secret = !NON_SECRET_MANAGED.has(key);
    return {
      key,
      configured: Boolean(value),
      source: value ? (envManaged ? 'environment' : 'settings') : null,
      editable: !envManaged,
      value: value && !secret ? value : null,
      hint: value && secret ? maskSecret(value) : null
    };
  });

  const business = {};
  for (const key of BUSINESS_KEYS) business[key] = cache.values.get(key) || '';

  return { integrations, business, secretsConfigured: secretsConfigured() };
}

/** Store or clear a managed credential. */
export async function setManagedSecret(key, value, userId = null) {
  if (!MANAGED_SECRETS.includes(key)) {
    const err = new Error(`${key} is not a managed setting`);
    err.status = 400;
    throw err;
  }
  if (isEnvManaged(key)) {
    const err = new Error(`${key} is set in this deployment's environment and cannot be changed here`);
    err.status = 409;
    throw err;
  }

  const clearing = value === null || value === undefined || String(value).trim() === '';
  if (clearing) {
    await query('DELETE FROM app_settings WHERE key = $1', [key]);
    await refreshSettings();
    return { key, configured: false };
  }

  const secret = !NON_SECRET_MANAGED.has(key);
  if (secret && !secretsConfigured()) {
    const err = new Error('SECRETS_KEY is not set on this deployment, so credentials cannot be stored safely');
    err.status = 503;
    throw err;
  }

  const stored = secret ? encrypt(String(value).trim()) : String(value).trim();
  await query(
    `INSERT INTO app_settings (key, value, is_secret, updated_at, updated_by)
     VALUES ($1, $2, $3, now(), $4)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, is_secret = EXCLUDED.is_secret,
                                     updated_at = now(), updated_by = EXCLUDED.updated_by`,
    [key, stored, secret, userId]);
  await refreshSettings();
  return { key, configured: true, hint: secret ? maskSecret(String(value).trim()) : null };
}

/** Store plain business settings. Unknown keys are ignored, not trusted. */
export async function setBusinessSettings(values = {}, userId = null) {
  const written = [];
  for (const [key, value] of Object.entries(values)) {
    if (!BUSINESS_KEYS.includes(key)) continue;
    const text = value === null ? '' : String(value).trim();
    if (!text) {
      await query('DELETE FROM app_settings WHERE key = $1', [key]);
    } else {
      await query(
        `INSERT INTO app_settings (key, value, is_secret, updated_at, updated_by)
         VALUES ($1, $2, false, now(), $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`,
        [key, text, userId]);
    }
    written.push(key);
  }
  await refreshSettings();
  return written;
}

/** The business identity an invoice prints, with sensible fallbacks. */
export async function businessProfile() {
  await loadCache();
  const get = (key, fallback = '') => cache.values.get(key) || fallback;
  return {
    name: get('business.name', 'HBBA Global'),
    address: get('business.address'),
    email: get('business.email'),
    phone: get('business.phone'),
    registrationNo: get('business.registration_no'),
    vatNo: get('business.vat_no'),
    logoUrl: get('business.logo_url'),
    invoicePrefix: get('business.invoice_prefix', 'INV'),
    invoiceFooter: get('business.invoice_footer')
  };
}

/* ===================== BANK ACCOUNTS ===================== */

export async function listBankAccounts() {
  const { rows } = await query('SELECT * FROM bank_accounts ORDER BY is_default DESC, label');
  return rows;
}

export async function saveBankAccount(input, id = null) {
  const fields = {
    label: String(input.label || '').trim(),
    account_name: String(input.account_name || '').trim(),
    bank_name: String(input.bank_name || '').trim() || null,
    account_number: String(input.account_number || '').trim() || null,
    sort_code: String(input.sort_code || '').trim() || null,
    iban: String(input.iban || '').trim() || null,
    swift: String(input.swift || '').trim() || null,
    account_type: String(input.account_type || '').trim() || null
  };
  if (!fields.label) throw Object.assign(new Error('A label is required'), { status: 400 });
  if (!fields.account_name) throw Object.assign(new Error('The account name is required'), { status: 400 });

  const makeDefault = input.is_default === true;
  // One default only; clear the old one first so the unique index is satisfied.
  if (makeDefault) await query('UPDATE bank_accounts SET is_default = false WHERE is_default = true');

  if (id) {
    const { rows } = await query(
      `UPDATE bank_accounts SET label=$1, account_name=$2, bank_name=$3, account_number=$4,
              sort_code=$5, iban=$6, swift=$7, account_type=$8,
              is_default = CASE WHEN $9 THEN true ELSE is_default END, updated_at = now()
        WHERE id = $10 RETURNING *`,
      [...Object.values(fields), makeDefault, id]);
    if (!rows[0]) throw Object.assign(new Error('Bank account not found'), { status: 404 });
    return rows[0];
  }

  const existing = await query('SELECT count(*)::int AS n FROM bank_accounts');
  const first = existing.rows[0].n === 0;
  const { rows } = await query(
    `INSERT INTO bank_accounts (label, account_name, bank_name, account_number, sort_code, iban, swift, account_type, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [...Object.values(fields), makeDefault || first]);
  return rows[0];
}

export async function deleteBankAccount(id) {
  const { rows } = await query('DELETE FROM bank_accounts WHERE id = $1 RETURNING id, is_default', [id]);
  if (!rows[0]) throw Object.assign(new Error('Bank account not found'), { status: 404 });
  // Keep a default if any accounts remain.
  if (rows[0].is_default) {
    await query(
      `UPDATE bank_accounts SET is_default = true
        WHERE id = (SELECT id FROM bank_accounts ORDER BY created_at LIMIT 1)`);
  }
  return true;
}
