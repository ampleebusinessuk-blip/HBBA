import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';
import { sanitisePermissions, PERMISSION_KEYS } from '../server/permissions.js';

let server;
let base;
let adminCookie;
let memberCookie;
const MEMBER = 'perm.member@perm.test';

async function req(path, { method = 'GET', body, cookie } = {}) {
  return fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
}
const adminReq = (path, o = {}) => req(path, { ...o, cookie: adminCookie });
const memberReq = (path, o = {}) => req(path, { ...o, cookie: memberCookie });
const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];
const grant = (permissions) => adminReq(`/api/admin/users/${encodeURIComponent(MEMBER)}/permissions`, { method: 'PATCH', body: { permissions } });

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  const hash = await hashPassword('password123');
  for (const [email, role] of [['perm.admin@perm.test', 'admin'], [MEMBER, 'member']]) {
    await query(
      `INSERT INTO users (email, password_hash, role, full_name, status) VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, permissions = '[]'::jsonb`,
      [email, hash, role, `Perm ${role}`]);
  }
  await new Promise((r) => { server = createApp().listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}`;
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'perm.admin@perm.test', password: 'password123' } }));
  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: MEMBER, password: 'password123' } }));
});

after(async () => {
  await query("DELETE FROM users WHERE email LIKE '%@perm.test'");
  await new Promise((r) => server.close(r));
  await closePool();
});

test('a member holds nothing until an admin grants it', async () => {
  await grant([]);
  const me = await (await memberReq('/api/auth/me')).json();
  assert.deepEqual(me.permissions, []);
  assert.equal((await memberReq('/api/admin/eventbrite/status')).status, 403);
  assert.equal((await memberReq('/api/admin/contacts')).status, 403);
  assert.equal((await memberReq('/api/admin/events', {
    method: 'POST', body: { title: 'Should not be allowed' }
  })).status, 403, 'writes are refused too');
});

test('a granted capability opens exactly that area and nothing else', async () => {
  const granted = await grant(['events.manage']);
  assert.equal(granted.status, 200);
  assert.deepEqual((await granted.json()).user.permissions, ['events.manage']);

  const me = await (await memberReq('/api/auth/me')).json();
  assert.deepEqual(me.permissions, ['events.manage'], 'the session reports what it holds');

  // The granted area works, including writes.
  const created = await memberReq('/api/admin/events', {
    method: 'POST', body: { title: 'Perm test event', date_label: 'Nov 01', time_label: '9 AM', city: 'London', capacity: 10 }
  });
  assert.equal(created.status, 201);
  const code = (await created.json()).event.code;

  // Everything else stays shut.
  for (const path of ['/api/admin/contacts', '/api/admin/invoices', '/api/admin/campaigns', '/api/admin/tickets', '/api/admin/stats']) {
    assert.equal((await memberReq(path)).status, 403, `${path} stays closed`);
  }
  // Administrator-only surfaces are never delegable.
  assert.equal((await memberReq('/api/admin/users')).status, 403);
  assert.equal((await memberReq('/api/admin/settings')).status, 403);

  await query('DELETE FROM events WHERE code = $1', [code]);
});

test('revoking takes effect on the next request, not when the session expires', async () => {
  await grant(['invoices.manage']);
  assert.equal((await memberReq('/api/admin/invoices')).status, 200);

  await grant([]);
  // Same cookie, no re-login: the check reads the database every time.
  assert.equal((await memberReq('/api/admin/invoices')).status, 403, 'access stops immediately');
});

test('several capabilities can be held at once', async () => {
  await grant(['crm.manage', 'support.manage', 'reports.view']);
  assert.equal((await memberReq('/api/admin/contacts')).status, 200);
  assert.equal((await memberReq('/api/admin/stats')).status, 200);
  assert.equal((await memberReq('/api/admin/campaigns')).status, 403);
});

test('invented capabilities are discarded rather than stored', async () => {
  const res = await grant(['events.manage', 'everything.manage', 'DROP TABLE users']);
  assert.deepEqual((await res.json()).user.permissions, ['events.manage']);
  assert.deepEqual(sanitisePermissions(['crm.manage', 'nope']), ['crm.manage']);
  assert.deepEqual(sanitisePermissions('not an array'), []);
});

test('an administrator cannot be given a permission list', async () => {
  const res = await adminReq('/api/admin/users/perm.admin@perm.test/permissions', { method: 'PATCH', body: { permissions: ['crm.manage'] } });
  assert.equal(res.status, 404);

  const admin = await (await adminReq('/api/auth/me')).json();
  assert.deepEqual(admin.permissions.sort(), [...PERMISSION_KEYS].sort(), 'admins hold everything by role');
});

test('only an administrator can grant', async () => {
  const res = await memberReq(`/api/admin/users/${encodeURIComponent(MEMBER)}/permissions`, { method: 'PATCH', body: { permissions: ['invoices.manage'] } });
  assert.equal(res.status, 403);
});

test('a suspended account holds nothing, whatever it was granted', async () => {
  await grant(['events.manage']);
  await query("UPDATE users SET status = 'suspended' WHERE email = $1", [MEMBER]);
  try {
    assert.equal((await memberReq('/api/admin/eventbrite/status')).status, 403, 'suspension overrides the grant');
  } finally {
    await query("UPDATE users SET status = 'active' WHERE email = $1", [MEMBER]);
  }
});

test('the team list shows what each account holds', async () => {
  await grant(['tasks.manage']);
  const data = await (await adminReq('/api/admin/users')).json();
  const member = data.users.find((u) => u.email === MEMBER);
  assert.deepEqual(member.permissions, ['tasks.manage']);
  const admin = data.users.find((u) => u.email === 'perm.admin@perm.test');
  assert.equal(admin.permissions, 'all');
  assert.ok(data.available.some((p) => p.key === 'events.manage' && p.label), 'the grantable list is offered with labels');
});
