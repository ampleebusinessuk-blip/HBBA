import 'dotenv/config';
import { createApp } from './app.js';
import { pool } from './db.js';

const PORT = process.env.PORT || 3000;

async function main() {
  // Fail fast if the database is unreachable.
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('Cannot reach the database. Is Postgres running (docker compose up -d)?');
    console.error(err.message);
    process.exit(1);
  }

  // First run on a fresh database: a self-hosted deployment would otherwise
  // have no way in. Driven entirely by environment, idempotent, and silent
  // unless configured.
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    try {
      const { bootstrapAdmin } = await import('./admin-bootstrap.js');
      const { query } = await import('./db.js');
      const result = await bootstrapAdmin({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        fullName: process.env.ADMIN_FULL_NAME || 'Administrator',
        org: process.env.ADMIN_ORG
      }, { query });
      console.log(`admin ${result.created ? 'created' : 'updated'}: ${result.email}`);
    } catch (err) {
      // Never block startup on this; the portal still serves everything else.
      console.error('Admin bootstrap skipped:', err.message);
    }
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`HBBA Global running on http://localhost:${PORT}`);
  });
}

main();
