import { hashPassword } from './auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEMO_PASSWORD = 'hbbaglobal';

export function validateAdminInput(input, env = process.env) {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const fullName = String(input.fullName || '').trim();
  const org = String(input.org || 'HBBA Global').trim();

  if (!EMAIL_RE.test(email)) throw new Error('ADMIN_EMAIL must be a valid email');
  if (env.NODE_ENV === 'production' && password === DEMO_PASSWORD) {
    throw new Error('ADMIN_PASSWORD must not use the demo password in production');
  }
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  if (!fullName) throw new Error('ADMIN_FULL_NAME is required');

  return { email, password, fullName, org };
}

export async function bootstrapAdmin(input, deps) {
  const clean = validateAdminInput(input);
  const passwordHash = await hashPassword(clean.password);
  const result = await deps.query(
    `INSERT INTO users (email, password_hash, role, full_name, org, status)
     VALUES ($1, $2, 'admin', $3, $4, 'active')
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       full_name = EXCLUDED.full_name,
       org = EXCLUDED.org,
       status = 'active'
     RETURNING email, (xmax = 0) AS created`,
    [clean.email, passwordHash, clean.fullName, clean.org]
  );

  return { email: result.rows[0].email, created: result.rows[0].created };
}
