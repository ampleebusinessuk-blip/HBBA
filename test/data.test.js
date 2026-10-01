import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

let server;
let base;
let dbReady = false;
let memberCookie;
let sponsorCookie;
let adminCookie;

async function req(path, { method = 'GET', body, cookie } = {}) {
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

async function upsertUser(email, role) {
  const passwordHash = await hashPassword('password123');
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, org, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role
     RETURNING id`,
    [email, passwordHash, role, `${role} smoke`, `${role} org`]
  );
  return rows[0].id;
}

before(async () => {
  try {
    await pool.query('SELECT 1');
    dbReady = true;
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }

  const memberId = await upsertUser('smoke.member@example.com', 'member');
  const sponsorId = await upsertUser('smoke.sponsor@example.com', 'sponsor');
  await upsertUser('smoke.admin@example.com', 'admin');

  await pool.query(
    `INSERT INTO events (code, title, date_label, time_label, city, capacity, status)
     VALUES ('SMOKE-EVENT', 'Smoke Test Event', '1 Jul', '10 AM', 'London', 20, 'Selling')
     ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title`
  );

  await pool.query(
    `INSERT INTO sponsorships (user_id, tier, value_cents, renews, since, impressions, placements, leads_count, meetings, inclusions)
     VALUES ($1, 'Gold', 100000, 'Jul 2027', 'Jul 2026', 1000, 3, 2, 1, '["Logo placement"]')
     ON CONFLICT (user_id) DO UPDATE SET tier=EXCLUDED.tier`,
    [sponsorId]
  );

  await pool.query(
    `INSERT INTO invoices (number, user_id, description, amount_cents, issued_on, status)
     VALUES ('SMOKE-INV-MEMBER', $1, 'Smoke invoice', 1000, '1 Jul', 'paid')
     ON CONFLICT (number) DO UPDATE SET user_id=EXCLUDED.user_id`,
    [memberId]
  );

  await new Promise((resolve) => {
    server = createApp().listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'smoke.member@example.com', password: 'password123' } }));
  sponsorCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'smoke.sponsor@example.com', password: 'password123' } }));
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'smoke.admin@example.com', password: 'password123' } }));
});

after(async () => {
  if (dbReady) {
    await pool.query("DELETE FROM invoices WHERE number LIKE 'SMOKE-%'");
    await pool.query("DELETE FROM sponsorships WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'smoke.%@example.com')");
    await pool.query("DELETE FROM users WHERE email LIKE 'smoke.%@example.com'");
    await pool.query("DELETE FROM events WHERE code LIKE 'SMOKE-%' OR title='Smoke Created Event'");
  }
  if (server) await new Promise((r) => server.close(r));
  await closePool();
});

test('member can view events, book an event, and see tickets', async () => {
  const events = await req('/api/events', { cookie: memberCookie });
  assert.equal(events.status, 200);
  assert.ok((await events.json()).events.some((event) => event.id === 'SMOKE-EVENT'));

  const booking = await req('/api/events/SMOKE-EVENT/book', { method: 'POST', cookie: memberCookie, body: { tier: 'VIP' } });
  assert.equal(booking.status, 201);

  const tickets = await req('/api/me/bookings', { cookie: memberCookie });
  assert.equal(tickets.status, 200);
  assert.ok((await tickets.json()).tickets.some((ticket) => ticket.event === 'Smoke Test Event'));
});

test('sponsor can view overview', async () => {
  const overview = await req('/api/sponsor/overview', { cookie: sponsorCookie });
  assert.equal(overview.status, 200);
  assert.equal((await overview.json()).overview.tier, 'Gold');
});

test('admin can view stats and create event', async () => {
  const stats = await req('/api/admin/stats', { cookie: adminCookie });
  assert.equal(stats.status, 200);

  const created = await req('/api/admin/events', {
    method: 'POST',
    cookie: adminCookie,
    body: { title: 'Smoke Created Event', date_label: '2 Jul', time_label: '2 PM', city: 'London', capacity: 30 }
  });
  assert.equal(created.status, 201);
  assert.ok((await created.json()).event.code.startsWith('E'));
});
