// Self-service profiles. The account belongs to the person using it, so their
// name, picture and contact details are theirs to change — and the things that
// are not theirs to change must stay out of reach.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword, verifyPassword } from '../server/auth.js';

let server;
let base;
const cookies = {};

const PEOPLE = [['pf.admin@pf.test', 'admin'], ['pf.member@pf.test', 'member'], ['pf.sponsor@pf.test', 'sponsor']];

// A 1×1 PNG, which is a real image of a declared type and nothing more.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

async function req(path, { method = 'GET', body, cookie } = {}) {
  return fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
}
const as = (who, path, o = {}) => req(path, { ...o, cookie: cookies[who] });
const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  const hash = await hashPassword('password123');
  for (const [email, role] of PEOPLE) {
    await query(
      `INSERT INTO users (email, password_hash, role, full_name, status) VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role,
         avatar_data = NULL, job_title = NULL, phone = NULL, city = NULL, website = NULL, bio = NULL`,
      [email, hash, role, `Profile ${role}`]);
  }
  await new Promise((r) => { server = createApp().listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}`;
  for (const [email, role] of PEOPLE) {
    cookies[role] = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email, password: 'password123' } }));
  }
});

after(async () => {
  await query("DELETE FROM users WHERE email LIKE '%@pf.test'");
  await new Promise((r) => server.close(r));
  await closePool();
});

test('every role has a profile, and sees their own', async () => {
  for (const [email, role] of PEOPLE) {
    const res = await as(role, '/api/profile');
    assert.equal(res.status, 200, `${role} should be able to read their profile`);
    const { profile } = await res.json();
    assert.equal(profile.email, email);
    assert.equal(profile.role, role);
  }
});

test('signing out leaves the profile unreachable', async () => {
  assert.equal((await req('/api/profile')).status, 401);
});

test('a person can fill in everything about themselves', async () => {
  const res = await as('member', '/api/profile', {
    method: 'PATCH',
    body: {
      full_name: 'Jane Cole', job_title: 'Managing Director', org: 'Cole & Co',
      phone: '+44 7700 900000', city: 'Birmingham', website: 'https://cole.example',
      bio: 'Twenty years in logistics.'
    }
  });
  assert.equal(res.status, 200);
  const { profile } = await res.json();
  assert.equal(profile.full_name, 'Jane Cole');
  assert.equal(profile.job_title, 'Managing Director');
  assert.equal(profile.city, 'Birmingham');
  assert.equal(profile.bio, 'Twenty years in logistics.');
});

test('a name cannot be emptied, and a website must look like one', async () => {
  const blank = await as('member', '/api/profile', { method: 'PATCH', body: { full_name: '  ' } });
  assert.equal(blank.status, 400);
  assert.match((await blank.json()).error, /cannot be empty/i);

  const bad = await as('member', '/api/profile', { method: 'PATCH', body: { website: 'cole.example' } });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /http/i);
});

test('an over-long field is refused rather than silently cut short', async () => {
  const res = await as('member', '/api/profile', { method: 'PATCH', body: { bio: 'x'.repeat(2001) } });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /too long/i);
});

test('role, status and permissions cannot be changed from the profile page', async () => {
  const res = await as('member', '/api/profile', {
    method: 'PATCH',
    body: { full_name: 'Jane Cole', role: 'admin', status: 'active', permissions: ['invoices.manage'], email: 'someone@else.test' }
  });
  assert.equal(res.status, 200);
  const { rows } = await query('SELECT role, email, permissions FROM users WHERE email = $1', ['pf.member@pf.test']);
  assert.equal(rows[0].role, 'member');
  assert.equal(rows[0].email, 'pf.member@pf.test');
  assert.deepEqual(rows[0].permissions, []);
});

test('nothing to update says so, rather than pretending to save', async () => {
  const res = await as('member', '/api/profile', { method: 'PATCH', body: {} });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /nothing to update/i);
});

test('a picture is stored on the row and comes back with the session', async () => {
  const res = await as('sponsor', '/api/profile/avatar', { method: 'PUT', body: { avatar: PNG } });
  assert.equal(res.status, 200);
  const { profile } = await res.json();
  assert.match(profile.avatar, /^data:image\/png;base64,/);

  // The header renders from the session, so the picture has to travel with it.
  const me = await as('sponsor', '/api/auth/me');
  assert.ok((await me.json()).user.avatar);
});

test('only a real image of a declared type is accepted', async () => {
  const cases = [
    ['', /no image/i],
    ['https://example.com/me.jpg', /does not look like an image/i],
    ['data:text/html;base64,PGgxPmhpPC9oMT4=', /does not look like an image/i],
    ['data:image/svg+xml;base64,PHN2Zy8+', /JPEG, PNG or WebP/i]
  ];
  for (const [value, expected] of cases) {
    const res = await as('sponsor', '/api/profile/avatar', { method: 'PUT', body: { avatar: value } });
    assert.ok(res.status >= 400, `${value.slice(0, 24)} should have been refused`);
    assert.match((await res.json()).error, expected);
  }
});

test('an oversized picture is refused with a size, not a stack trace', async () => {
  const huge = 'data:image/png;base64,' + 'A'.repeat(220_000);
  const res = await as('sponsor', '/api/profile/avatar', { method: 'PUT', body: { avatar: huge } });
  assert.equal(res.status, 413);
  assert.match((await res.json()).error, /too large/i);
});

test('a picture can be taken down again', async () => {
  await as('sponsor', '/api/profile/avatar', { method: 'PUT', body: { avatar: PNG } });
  const res = await as('sponsor', '/api/profile/avatar', { method: 'DELETE' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).profile.avatar, null);
});

test('changing a password needs the current one', async () => {
  const wrong = await as('admin', '/api/profile/password', {
    method: 'POST', body: { current_password: 'not-it', new_password: 'brand-new-secret' }
  });
  assert.equal(wrong.status, 403);
  assert.match((await wrong.json()).error, /not right/i);

  const short = await as('admin', '/api/profile/password', {
    method: 'POST', body: { current_password: 'password123', new_password: 'short' }
  });
  assert.equal(short.status, 400);
  assert.match((await short.json()).error, /at least 8/i);

  const ok = await as('admin', '/api/profile/password', {
    method: 'POST', body: { current_password: 'password123', new_password: 'brand-new-secret' }
  });
  assert.equal(ok.status, 200);

  const { rows } = await query('SELECT password_hash FROM users WHERE email = $1', ['pf.admin@pf.test']);
  assert.ok(await verifyPassword('brand-new-secret', rows[0].password_hash));
  assert.equal(await verifyPassword('password123', rows[0].password_hash), false);
});

test('the new password is never stored in the clear', async () => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', ['pf.admin@pf.test']);
  const dump = JSON.stringify(rows[0]);
  assert.equal(dump.includes('brand-new-secret'), false);
});
