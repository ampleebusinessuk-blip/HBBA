import pg from 'pg';
import 'dotenv/config';
import { getRuntimeConfig } from './config.js';

const { pgPoolOptions } = getRuntimeConfig();

// Reuse a single pool across warm serverless invocations to avoid exhausting
// database connections. On a local long-lived server this is just a singleton.
const g = globalThis;
export const pool = g.__hbbaPool || (g.__hbbaPool = new pg.Pool(pgPoolOptions));

const TRANSIENT = /timeout|ECONNRESET|ETIMEDOUT|ENOTFOUND|Connection terminated|terminating connection|connection is closed/i;

// Retry once on transient connection errors (e.g. Neon waking from auto-suspend),
// so the first request after idle self-heals instead of failing.
export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (TRANSIENT.test(err.message) || TRANSIENT.test(err.code || '')) {
      await new Promise((r) => setTimeout(r, 400));
      return pool.query(text, params);
    }
    throw err;
  }
}

export async function closePool() {
  await pool.end();
  delete globalThis.__hbbaPool;
}
