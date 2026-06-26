import { pool, closePool } from './server/db.js';
import { hashPassword } from './server/auth.js';

const DEMO_PASSWORD = 'hbbaglobal';

const accounts = [
  { email: 'admin@hbbaglobal.co.uk', role: 'admin', full_name: 'John Doe', org: 'HBBA Global' },
  { email: 'member@hbbaglobal.co.uk', role: 'member', full_name: 'Jane Cole', org: 'Cole & Co' },
  { email: 'sponsor@hbbaglobal.co.uk', role: 'sponsor', full_name: 'Acme Corp', org: 'Acme Corp' }
];

async function seed() {
  const hash = await hashPassword(DEMO_PASSWORD);
  for (const a of accounts) {
    await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, org, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             full_name = EXCLUDED.full_name,
             org = EXCLUDED.org,
             status = 'active'`,
      [a.email, hash, a.role, a.full_name, a.org]
    );
    console.log(`seeded ${a.email} (${a.role})`);
  }
  console.log(`demo password: ${DEMO_PASSWORD}`);
}

seed()
  .then(closePool)
  .catch(async (err) => {
    await closePool();
    console.error(err);
    process.exit(1);
  });
