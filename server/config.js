const LOCAL_DATABASE_URL = 'postgres://hbba:hbba@localhost:5544/hbba';
const DEV_JWT_SECRET = 'dev-only-change-me';

function isLocalDatabaseUrl(url) {
  return /@(localhost|127\.0\.0\.1|\[::1\])(?::|\/)/i.test(url)
    || /\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/)/i.test(url);
}

export function getRuntimeConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const databaseUrl = env.DATABASE_URL || LOCAL_DATABASE_URL;
  const jwtSecret = env.JWT_SECRET || DEV_JWT_SECRET;

  if (isProduction && !env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }

  if (isProduction && (jwtSecret === DEV_JWT_SECRET || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be a long random value in production');
  }

  if (isProduction && isLocalDatabaseUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must not point at localhost in production');
  }

  const pgPoolOptions = {
    connectionString: databaseUrl,
    max: Number(env.PG_POOL_MAX || 5),
    connectionTimeoutMillis: Number(env.PG_CONNECTION_TIMEOUT_MS || 3000),
    idleTimeoutMillis: Number(env.PG_IDLE_TIMEOUT_MS || 30000)
  };

  if (isProduction && env.PGSSL !== 'disable') {
    pgPoolOptions.ssl = { rejectUnauthorized: false };
  }

  return { nodeEnv, isProduction, databaseUrl, jwtSecret, pgPoolOptions };
}
