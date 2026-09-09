import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, closePool } from '../server/db.js';

const here = dirname(fileURLToPath(import.meta.url));

// Any instance may call this (CLI or the deployment itself), so serialise on a
// Postgres advisory lock: two runners can never apply the same file twice.
const LOCK_KEY = 4820257311;

/**
 * Apply every migration that has not run yet.
 * Returns { applied: string[], alreadyApplied: string[] }.
 */
export async function runMigrations({ log = () => {} } = {}) {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    run_at timestamptz NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(here)).filter((f) => f.endsWith('.sql')).sort();
  const lock = await pool.connect();
  const applied = [];
  let alreadyApplied = [];

  try {
    await lock.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
    alreadyApplied = [...done].sort();

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(join(here, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        log(`applied ${file}`);
        applied.push(file);
      } catch (err) {
        await client.query('ROLLBACK');
        log(`failed ${file}: ${err.message}`);
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await lock.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    lock.release();
  }

  log(applied.length ? `${applied.length} migration(s) applied` : 'up to date');
  return { applied, alreadyApplied };
}

// CLI entry: `npm run migrate`.
if (process.argv[1] && process.argv[1].endsWith(join('migrations', 'run.js'))) {
  runMigrations({ log: (m) => console.log(m) })
    .then(closePool)
    .catch(async (err) => {
      await closePool();
      console.error(err);
      process.exit(1);
    });
}
