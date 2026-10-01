import { randomBytes, createHash } from 'node:crypto';
import { query } from './db.js';
import { appUrl } from './email.js';

const RESET_TTL_MINUTES = 60;
const INVITE_TTL_MINUTES = 7 * 24 * 60;

export const hashToken = (raw) => createHash('sha256').update(raw).digest('hex');

/** Issue a single-use reset/invite token and return the link to send out. */
export async function createResetLink(userId, purpose = 'reset') {
  const raw = randomBytes(32).toString('hex');
  await query(
    `INSERT INTO password_resets (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval)`,
    [userId, hashToken(raw), purpose, String(purpose === 'invite' ? INVITE_TTL_MINUTES : RESET_TTL_MINUTES)]);
  return { link: `${appUrl()}/#reset?token=${raw}`, token: raw, ttlMinutes: purpose === 'invite' ? INVITE_TTL_MINUTES : RESET_TTL_MINUTES };
}

/** Look up an unused, unexpired token together with its owner. */
export async function findLiveToken(raw) {
  const { rows } = await query(
    `SELECT r.id, r.user_id, r.purpose, u.email, u.role, u.full_name, u.org, u.status
       FROM password_resets r JOIN users u ON u.id = r.user_id
      WHERE r.token_hash = $1 AND r.used_at IS NULL AND r.expires_at > now()`,
    [hashToken(raw)]);
  return rows[0] || null;
}

export async function consumeToken(id) {
  await query('UPDATE password_resets SET used_at = now() WHERE id = $1', [id]);
}

export { RESET_TTL_MINUTES };
