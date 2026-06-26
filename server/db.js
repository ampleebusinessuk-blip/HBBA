import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgres://hbba:hbba@localhost:5432/hbba';

export const pool = new pg.Pool({ connectionString });

export function query(text, params) {
  return pool.query(text, params);
}

export async function closePool() {
  await pool.end();
}
