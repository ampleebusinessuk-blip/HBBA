import pg from 'pg';
import 'dotenv/config';
import { getRuntimeConfig } from './config.js';

const { pgPoolOptions } = getRuntimeConfig();

// Reuse a single pool across warm serverless invocations to avoid exhausting
// database connections. On a local long-lived server this is just a singleton.
const g = globalThis;
export const pool = g.__hbbaPool || (g.__hbbaPool = new pg.Pool(pgPoolOptions));

export function query(text, params) {
  return pool.query(text, params);
}

export async function closePool() {
  await pool.end();
  delete globalThis.__hbbaPool;
}
