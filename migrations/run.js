import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, closePool } from '../server/db.js';

const here = dirname(fileURLToPath(import.meta.url));

async function run() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    run_at timestamptz NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(here))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const done = new Set(
    (await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name)
  );

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(join(here, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`applied ${file}`);
      applied++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`failed ${file}:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(applied ? `${applied} migration(s) applied` : 'up to date');
}

run()
  .then(closePool)
  .catch(async (err) => {
    await closePool();
    console.error(err);
    process.exit(1);
  });
