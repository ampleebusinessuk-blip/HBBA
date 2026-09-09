import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

let server;
let base;
let adminCookie;
let memberCookie;
let memberEmail;
let eventCode;

async function req(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];

async function upsertUser(email, role) {
  const passwordHash = await hashPassword('password123');
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, org, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role
     RETURNING id`,
    [email, passwordHash, role, `crm ${role}`, `${role} org`]);
  return rows[0].id;
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }

  memberEmail = 'crm.member@example.com';
  await upsertUser('crm.admin@example.com', 'admin');
  await upsertUser(memberEmail, 'member');

  eventCode = 'CRM-EVENT';
  await pool.query(
    `INSERT INTO events (code, title, date_label, time_label, city, capacity, status)
     VALUES ($1, 'CRM Test Event', '9 Sep', '6 PM', 'London', 5, 'Selling')
     ON CONFLICT (code) DO UPDATE SET status = 'Selling', capacity = 5`,
    [eventCode]);

  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;

  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'crm.admin@example.com', password: 'password123' } }));
  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: memberEmail, password: 'password123' } }));
});

after(async () => {
  await pool.query("DELETE FROM contacts WHERE email LIKE 'crm.%@example.com'");
  await pool.query("DELETE FROM campaigns WHERE name LIKE 'CRM test%'");
  await pool.query("DELETE FROM intro_requests WHERE to_name = 'CRM Target'");
  await pool.query("DELETE FROM event_bookings WHERE event_id = (SELECT id FROM events WHERE code = $1)", [eventCode]);
  await pool.query("DELETE FROM users WHERE email LIKE 'crm.%@example.com'");
  await pool.query("DELETE FROM events WHERE code = $1", [eventCode]);
  await new Promise((r) => server.close(r));
  await closePool();
});

test('contacts: create, list, log a touch, then delete', async () => {
  const created = await req('/api/admin/contacts', {
    method: 'POST', cookie: adminCookie,
    body: { name: 'CRM Contact', email: 'crm.contact@example.com', company: 'CRM Ltd', city: 'Leeds', tier: 'Gold', status: 'Warm' }
  });
  assert.equal(created.status, 201);
  const { contact } = await created.json();
  assert.equal(contact.status, 'Warm');

  const listed = await req('/api/admin/contacts', { cookie: adminCookie });
  assert.equal(listed.status, 200);
  const list = await listed.json();
  assert.ok(list.contacts.some((c) => c.email === 'crm.contact@example.com'));
  assert.ok(list.stats.contacts >= 1);

  const logged = await req(`/api/admin/contacts/${contact.id}/log`, { method: 'POST', cookie: adminCookie, body: { kind: 'call' } });
  assert.equal(logged.status, 200);

  const dupe = await req('/api/admin/contacts', {
    method: 'POST', cookie: adminCookie,
    body: { name: 'CRM Contact', email: 'crm.contact@example.com' }
  });
  assert.equal(dupe.status, 409);

  const removed = await req(`/api/admin/contacts/${contact.id}`, { method: 'DELETE', cookie: adminCookie });
  assert.equal(removed.status, 200);
});

test('contacts are admin-only', async () => {
  const res = await req('/api/admin/contacts', { cookie: memberCookie });
  assert.equal(res.status, 403);
});

test('memberships: tiers, tier edit, and renewal reminders', async () => {
  const tierRes = await req('/api/admin/users/crm.member@example.com/tier', {
    method: 'PATCH', cookie: adminCookie, body: { tier: 'Gold' }
  });
  assert.equal(tierRes.status, 200);

  const res = await req('/api/admin/memberships', { cookie: adminCookie });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.tiers.some((t) => t.name === 'Gold'));
  assert.equal(typeof data.stats.members, 'number');

  const edited = await req('/api/admin/tiers/Bronze', { method: 'PATCH', cookie: adminCookie, body: { price_cents: 49000 } });
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).tier.price_cents, 49000);

  const reminded = await req('/api/admin/renewals/remind', { method: 'POST', cookie: adminCookie, body: { email: memberEmail } });
  assert.equal(reminded.status, 200);
  assert.equal((await reminded.json()).reminded, 1);
});

test('campaigns: create, send to the real audience, refuse a second send', async () => {
  const created = await req('/api/admin/campaigns', {
    method: 'POST', cookie: adminCookie, body: { name: 'CRM test campaign', subject: 'Hello', segment: 'All members' }
  });
  assert.equal(created.status, 201);
  const { campaign } = await created.json();

  const sent = await req(`/api/admin/campaigns/${campaign.id}/send`, { method: 'POST', cookie: adminCookie });
  assert.equal(sent.status, 200);
  assert.ok((await sent.json()).sent >= 1);

  const again = await req(`/api/admin/campaigns/${campaign.id}/send`, { method: 'POST', cookie: adminCookie });
  assert.equal(again.status, 409);
});

test('networking: a member requests an intro and an admin matches it', async () => {
  const created = await req('/api/networking/intros', {
    method: 'POST', cookie: memberCookie, body: { to: 'CRM Target', reason: 'Market entry' }
  });
  assert.equal(created.status, 201);
  const { intro } = await created.json();

  const memberView = await req('/api/networking', { cookie: memberCookie });
  assert.equal(memberView.status, 200);
  assert.ok((await memberView.json()).intros.some((i) => i.id === intro.id));

  const decided = await req(`/api/admin/intros/${intro.id}`, { method: 'PATCH', cookie: adminCookie, body: { status: 'matched' } });
  assert.equal(decided.status, 200);
  assert.equal((await decided.json()).intro.status, 'matched');

  const notified = await req('/api/notifications', { cookie: memberCookie });
  assert.equal(notified.status, 200);
  const feed = await notified.json();
  assert.ok(feed.notifications.some((n) => n.title === 'Your introduction is confirmed'));
  assert.ok(feed.unread >= 1);

  const read = await req('/api/notifications/read', { method: 'POST', cookie: memberCookie });
  assert.equal(read.status, 200);
  assert.equal((await (await req('/api/notifications', { cookie: memberCookie })).json()).unread, 0);
});

test('ticket desk: issue a ticket, refund it, then cancel the event', async () => {
  const issued = await req('/api/admin/tickets', {
    method: 'POST', cookie: adminCookie, body: { email: memberEmail, event: eventCode, tier: 'VIP' }
  });
  assert.equal(issued.status, 201);
  const { ticket } = await issued.json();

  const missing = await req('/api/admin/tickets', {
    method: 'POST', cookie: adminCookie, body: { email: 'nobody@example.com', event: eventCode }
  });
  assert.equal(missing.status, 404);

  const refunded = await req(`/api/admin/tickets/${ticket.id}/refund`, { method: 'POST', cookie: adminCookie });
  assert.equal(refunded.status, 200);
  const twice = await req(`/api/admin/tickets/${ticket.id}/refund`, { method: 'POST', cookie: adminCookie });
  assert.equal(twice.status, 404);

  const cancelled = await req(`/api/admin/events/${eventCode}`, { method: 'PATCH', cookie: adminCookie, body: { status: 'Cancelled' } });
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).event.status, 'Cancelled');
});

test('member membership view is backed by their own record', async () => {
  const res = await req('/api/me/membership', { cookie: memberCookie });
  assert.equal(res.status, 200);
  const { membership } = await res.json();
  assert.equal(membership.tier, 'Gold');
  assert.ok(Array.isArray(membership.options));

  const same = await req('/api/me/membership/upgrade', { method: 'POST', cookie: memberCookie, body: { tier: 'Gold' } });
  assert.equal(same.status, 409);

  const upgrade = await req('/api/me/membership/upgrade', { method: 'POST', cookie: memberCookie, body: { tier: 'Silver' } });
  assert.equal(upgrade.status, 201);
});

test('dashboard activity feed records what actually happened', async () => {
  const res = await req('/api/admin/activity', { cookie: adminCookie });
  assert.equal(res.status, 200);
  const { activity } = await res.json();
  assert.ok(activity.length >= 1);
  assert.ok(activity.every((a) => typeof a.title === 'string' && typeof a.time === 'string'));
});
