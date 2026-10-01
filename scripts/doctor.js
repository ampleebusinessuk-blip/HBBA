// Boot diagnostics for a container deployment.
//
// When the app cannot start, the container exits and its logs go with it, which
// makes the real cause invisible. Run this as the start command instead and it
// reports what the runtime actually sees, then stays alive so the logs can be
// read:
//
//   npm run doctor
import 'dotenv/config';

const mask = (url) => {
  if (!url) return '(unset)';
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
  } catch {
    return '(unparseable)';
  }
};

console.log('--- HBBA doctor ---');
console.log('NODE_ENV      :', process.env.NODE_ENV || '(unset)');
console.log('PORT          :', process.env.PORT || '(unset)');
console.log('APP_URL       :', process.env.APP_URL || '(unset)');
console.log('JWT_SECRET    :', process.env.JWT_SECRET ? `set, ${process.env.JWT_SECRET.length} chars` : '(unset)');
console.log('DATABASE_URL  :', mask(process.env.DATABASE_URL));

try {
  const { getRuntimeConfig } = await import('../server/config.js');
  const config = getRuntimeConfig();
  console.log('config        : accepted (production =', config.isProduction, ')');
} catch (err) {
  console.log('config        : REJECTED —', err.message);
}

try {
  const { query } = await import('../server/db.js');
  const started = Date.now();
  const { rows } = await query('SELECT current_database() AS db, version() AS version');
  console.log(`database      : reachable in ${Date.now() - started}ms — ${rows[0].db}`);
  console.log('server        :', String(rows[0].version).split(',')[0]);
  const tables = await query(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('tables        :', tables.rows[0].n);
} catch (err) {
  console.log('database      : UNREACHABLE —', err.message);
}

console.log('--- holding the container open so these logs can be read ---');
setInterval(() => {}, 60_000);
