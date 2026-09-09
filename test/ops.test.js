import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';

let server;
let base;

async function req(path, { method = 'GET', headers = {} } = {}) {
  return fetch(base + path, { method, headers });
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await closePool();
});

test('the migrate endpoint is token-gated, runs migrations, and is idempotent', async () => {
  // One test, because the gate is read from process.env per request and the
  // states have to be exercised in order.
  delete process.env.MIGRATE_TOKEN;
  assert.equal((await req('/api/ops/migrate', { method: 'POST' })).status, 404, 'hidden while unset');

  const token = 'correct-horse-battery-staple';
  process.env.MIGRATE_TOKEN = token;
  try {
    assert.equal((await req('/api/ops/migrate', { method: 'POST' })).status, 401, 'missing token');
    assert.equal((await req('/api/ops/migrate', {
      method: 'POST', headers: { 'x-migrate-token': 'nope' }
    })).status, 401, 'wrong token');
    assert.equal((await req('/api/ops/migrate', {
      method: 'POST', headers: { 'x-migrate-token': 'correct-horse-battery-stapl3' }
    })).status, 401, 'near-miss token of equal length');

    const res = await req('/api/ops/migrate', { method: 'POST', headers: { 'x-migrate-token': token } });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.alreadyApplied.includes('001_users.sql'));
    assert.ok(data.alreadyApplied.includes('011_auth_and_payments.sql'));

    const again = await req('/api/ops/migrate', { method: 'POST', headers: { 'x-migrate-token': token } });
    assert.deepEqual((await again.json()).applied, [], 'a second run applies nothing');
  } finally {
    delete process.env.MIGRATE_TOKEN;
  }
});
