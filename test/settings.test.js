import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';
import { maskSecret, resolve, refreshSettings } from '../server/settings.js';
import { emailConfigured } from '../server/email.js';

let server;
let base;
let adminCookie;
let memberCookie;

async function req(path, { method = 'GET', body, cookie } = {}) {
  return fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
}
const adminReq = (path, options = {}) => req(path, { ...options, cookie: adminCookie });
const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];

async function wipe() {
  await query("DELETE FROM app_settings WHERE key LIKE 'business.%' OR key IN ('RESEND_API_KEY','EMAIL_FROM','STRIPE_SECRET_KEY')");
  await query("DELETE FROM bank_accounts WHERE label LIKE 'Test %'");
  await refreshSettings();
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  process.env.SECRETS_KEY = 'test-secrets-key-for-settings-suite';
  const hash = await hashPassword('password123');
  for (const [email, role] of [['set.admin@set.test', 'admin'], ['set.member@set.test', 'member']]) {
    await query(
      `INSERT INTO users (email, password_hash, role, full_name, status) VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [email, hash, role, `Settings ${role}`]);
  }
  await wipe();

  await new Promise((resolve_) => { server = createApp().listen(0, '127.0.0.1', resolve_); });
  base = `http://127.0.0.1:${server.address().port}`;
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'set.admin@set.test', password: 'password123' } }));
  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'set.member@set.test', password: 'password123' } }));
});

after(async () => {
  await wipe();
  await query("DELETE FROM users WHERE email LIKE '%@set.test'");
  delete process.env.SECRETS_KEY;
  await new Promise((r) => server.close(r));
  await closePool();
});

test('a credential saved in settings is usable but never readable', async () => {
  const saved = await adminReq('/api/admin/settings/integrations/RESEND_API_KEY', {
    method: 'PUT', body: { value: 're_live_abcdefghijklmnop' }
  });
  assert.equal(saved.status, 200);
  const result = await saved.json();
  assert.equal(result.configured, true);
  assert.equal(result.hint, 're_••••mnop', 'only a recognisable hint comes back');

  // The stored row is ciphertext, not the key.
  const { rows } = await query("SELECT value, is_secret FROM app_settings WHERE key = 'RESEND_API_KEY'");
  assert.equal(rows[0].is_secret, true);
  assert.ok(rows[0].value.startsWith('v1.'), 'stored encrypted');
  assert.ok(!rows[0].value.includes('abcdefghijklmnop'), 'the key itself is not in the database');

  // ...but the application can use it.
  assert.equal(resolve('RESEND_API_KEY'), 're_live_abcdefghijklmnop');
  assert.equal(emailConfigured(), true, 'email switches on without a redeploy');

  const overview = await (await adminReq('/api/admin/settings')).json();
  const entry = overview.integrations.find((i) => i.key === 'RESEND_API_KEY');
  assert.equal(entry.configured, true);
  assert.equal(entry.source, 'settings');
  assert.equal(entry.hint, 're_••••mnop');
  assert.equal(entry.value, null, 'the overview never carries the secret');
  assert.ok(!JSON.stringify(overview).includes('abcdefghijklmnop'));
});

test('clearing a credential switches the integration back off', async () => {
  await adminReq('/api/admin/settings/integrations/RESEND_API_KEY', { method: 'PUT', body: { value: 're_live_abcdefghijklmnop' } });
  assert.equal(emailConfigured(), true);

  const cleared = await adminReq('/api/admin/settings/integrations/RESEND_API_KEY', { method: 'PUT', body: { value: '' } });
  assert.equal(cleared.status, 200);
  assert.equal((await cleared.json()).configured, false);
  assert.equal(resolve('RESEND_API_KEY'), null);
  assert.equal(emailConfigured(), false);
});

test('the environment wins over a stored setting and locks the field', async () => {
  await adminReq('/api/admin/settings/integrations/STRIPE_SECRET_KEY', { method: 'PUT', body: { value: 'sk_from_settings' } });
  process.env.STRIPE_SECRET_KEY = 'sk_from_environment';
  await refreshSettings();
  try {
    assert.equal(resolve('STRIPE_SECRET_KEY'), 'sk_from_environment', 'the platform secret store stays authoritative');

    const overview = await (await adminReq('/api/admin/settings')).json();
    const entry = overview.integrations.find((i) => i.key === 'STRIPE_SECRET_KEY');
    assert.equal(entry.source, 'environment');
    assert.equal(entry.editable, false);

    const refused = await adminReq('/api/admin/settings/integrations/STRIPE_SECRET_KEY', { method: 'PUT', body: { value: 'sk_attempt' } });
    assert.equal(refused.status, 409, 'the UI cannot silently override the environment');
  } finally {
    delete process.env.STRIPE_SECRET_KEY;
    await query("DELETE FROM app_settings WHERE key = 'STRIPE_SECRET_KEY'");
    await refreshSettings();
  }
});

test('secrets are refused rather than stored in the clear without an encryption key', async () => {
  const key = process.env.SECRETS_KEY;
  delete process.env.SECRETS_KEY;
  await refreshSettings();
  try {
    const res = await adminReq('/api/admin/settings/integrations/RESEND_API_KEY', { method: 'PUT', body: { value: 're_plaintext_attempt' } });
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /SECRETS_KEY/);
    const { rows } = await query("SELECT count(*)::int AS n FROM app_settings WHERE key = 'RESEND_API_KEY'");
    assert.equal(rows[0].n, 0, 'nothing was written');
  } finally {
    process.env.SECRETS_KEY = key;
    await refreshSettings();
  }
});

test('an unknown setting key is rejected', async () => {
  const res = await adminReq('/api/admin/settings/integrations/DATABASE_URL', { method: 'PUT', body: { value: 'postgres://nope' } });
  assert.equal(res.status, 400);
});

test('business details round-trip and feed the invoice profile', async () => {
  const res = await adminReq('/api/admin/settings/business', {
    method: 'PATCH',
    body: {
      'business.name': 'HBBA Global Ltd',
      'business.address': '1 Example Street\nLondon',
      'business.registration_no': '12345678',
      'business.vat_no': 'GB123456789',
      'business.invoice_prefix': 'HBBA'
    }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.business['business.name'], 'HBBA Global Ltd');
  assert.equal(data.profile.registrationNo, '12345678');
  assert.equal(data.profile.invoicePrefix, 'HBBA');
});

test('bank accounts keep exactly one default', async () => {
  const first = await adminReq('/api/admin/bank-accounts', {
    method: 'POST', body: { label: 'Test current', account_name: 'HBBA Global', bank_name: 'Tide', sort_code: '04-06-05', account_number: '31925315' }
  });
  assert.equal(first.status, 201);
  assert.equal((await first.json()).account.is_default, true, 'the first account becomes the default');

  const second = await adminReq('/api/admin/bank-accounts', {
    method: 'POST', body: { label: 'Test savings', account_name: 'HBBA Global', is_default: true }
  });
  assert.equal(second.status, 201);
  const secondId = (await second.json()).account.id;

  const list = await (await adminReq('/api/admin/bank-accounts')).json();
  const defaults = list.accounts.filter((a) => a.is_default);
  assert.equal(defaults.length, 1, 'only one default survives');
  assert.equal(defaults[0].id, secondId);

  const bad = await adminReq('/api/admin/bank-accounts', { method: 'POST', body: { account_name: 'No label' } });
  assert.equal(bad.status, 400);

  const removed = await adminReq(`/api/admin/bank-accounts/${secondId}`, { method: 'DELETE' });
  assert.equal(removed.status, 200);
  const after = await (await adminReq('/api/admin/bank-accounts')).json();
  assert.equal(after.accounts.filter((a) => a.is_default).length, 1, 'a default is reassigned, not lost');
});

test('settings are admin-only', async () => {
  assert.equal((await req('/api/admin/settings', { cookie: memberCookie })).status, 403);
  assert.equal((await req('/api/admin/settings')).status, 401);
  assert.equal((await req('/api/admin/settings/integrations/RESEND_API_KEY', {
    method: 'PUT', body: { value: 'nope' }, cookie: memberCookie
  })).status, 403);
});

test('masking never leaks a short secret', () => {
  assert.equal(maskSecret('short'), '••••');
  assert.equal(maskSecret(''), null);
  assert.equal(maskSecret('re_1234567890'), 're_••••7890');
});
