import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRuntimeConfig } from '../server/config.js';

test('development config uses explicit safe local defaults', () => {
  const cfg = getRuntimeConfig({});
  assert.equal(cfg.nodeEnv, 'development');
  assert.equal(cfg.isProduction, false);
  assert.equal(cfg.jwtSecret, 'dev-only-change-me');
  assert.equal(cfg.databaseUrl, 'postgres://hbba:hbba@localhost:5544/hbba');
  assert.equal(cfg.pgPoolOptions.connectionTimeoutMillis, 3000);
});

test('production rejects missing database url', () => {
  assert.throws(
    () => getRuntimeConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) }),
    /DATABASE_URL is required in production/
  );
});

test('production rejects unsafe jwt secret', () => {
  assert.throws(
    () => getRuntimeConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://prod.example/hbba',
      JWT_SECRET: 'dev-only-change-me'
    }),
    /JWT_SECRET must be a long random value in production/
  );
});

test('production rejects localhost database url', () => {
  assert.throws(
    () => getRuntimeConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://hbba:hbba@localhost:5544/hbba',
      JWT_SECRET: 'x'.repeat(32)
    }),
    /DATABASE_URL must not point at localhost in production/
  );
});

test('production accepts managed postgres url and enables ssl unless explicitly disabled', () => {
  const cfg = getRuntimeConfig({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://user:pass@db.example.com:5432/hbba',
    JWT_SECRET: 'x'.repeat(32)
  });
  assert.equal(cfg.isProduction, true);
  assert.deepEqual(cfg.pgPoolOptions.ssl, { rejectUnauthorized: false });
});
