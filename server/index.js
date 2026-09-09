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

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`HBBA Global running on http://localhost:${PORT}`);
  });
}

main();
