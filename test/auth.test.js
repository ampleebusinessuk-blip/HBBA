import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = createApp().listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'test+%@example.com'");
  await new Promise((r) => server.close(r));
  await closePool();
});

function req(path, { method = 'GET', body, cookie } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];
const newEmail = () => `test+${randomUUID()}@example.com`;

test('signup creates a member, sets cookie, and /me returns the user', async () => {
  const email = newEmail();
  const res = await req('/api/auth/signup', { method: 'POST', body: { email, password: 'password123', full_name: 'Test User', role: 'member', org: 'Testco' } });
  assert.equal(res.status, 201);
  const { user } = await res.json();
  assert.equal(user.email, email);
  assert.equal(user.role, 'member');
  assert.ok(!('password_hash' in user), 'password_hash must not leak');

  const cookie = cookieOf(res);
  assert.ok(cookie.startsWith('hbba_token='), 'auth cookie set');

  const me = await req('/api/auth/me', { cookie });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.email, email);
});

test('duplicate email returns 409', async () => {
  const email = newEmail();
  const body = { email, password: 'password123', full_name: 'Dupe', role: 'member' };
  await req('/api/auth/signup', { method: 'POST', body });
  const res = await req('/api/auth/signup', { method: 'POST', body });
  assert.equal(res.status, 409);
});

test('cannot self-signup as admin', async () => {
  const res = await req('/api/auth/signup', { method: 'POST', body: { email: newEmail(), password: 'password123', full_name: 'Sneaky', role: 'admin' } });
  assert.equal(res.status, 400);
});

test('short password rejected', async () => {
  const res = await req('/api/auth/signup', { method: 'POST', body: { email: newEmail(), password: 'short', full_name: 'X', role: 'member' } });
  assert.equal(res.status, 400);
});

test('login: wrong password 401, correct 200', async () => {
  const email = newEmail();
  await req('/api/auth/signup', { method: 'POST', body: { email, password: 'password123', full_name: 'Login User', role: 'sponsor' } });

  const bad = await req('/api/auth/login', { method: 'POST', body: { email, password: 'wrongpass1' } });
  assert.equal(bad.status, 401);

  const good = await req('/api/auth/login', { method: 'POST', body: { email, password: 'password123' } });
  assert.equal(good.status, 200);
  assert.equal((await good.json()).user.role, 'sponsor');
});

test('login with unknown email returns 401 (no enumeration)', async () => {
  const res = await req('/api/auth/login', { method: 'POST', body: { email: newEmail(), password: 'whatever12' } });
  assert.equal(res.status, 401);
});

test('/me without cookie returns 401', async () => {
  const res = await req('/api/auth/me');
  assert.equal(res.status, 401);
});

test('logout clears the cookie', async () => {
  const email = newEmail();
  const signup = await req('/api/auth/signup', { method: 'POST', body: { email, password: 'password123', full_name: 'Bye', role: 'member' } });
  const cookie = cookieOf(signup);

  const out = await req('/api/auth/logout', { method: 'POST', cookie });
  assert.equal(out.status, 200);
  const cleared = cookieOf(out);
  // cleared cookie has empty value
  assert.ok(/hbba_token=;?/.test(cleared) || cleared === 'hbba_token=', 'cookie cleared');
});
