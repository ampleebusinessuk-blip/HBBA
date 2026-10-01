import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

let server;
let base;
let adminCookie;
let memberCookie;
const memberEmail = 'demo.member@example.com';
const invoiceNumber = 'DEMO-INV-1';

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

async function resetInvoice() {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [memberEmail]);
  await pool.query(
    `INSERT INTO invoices (number, user_id, description, amount_cents, issued_on, status)
     VALUES ($1, $2, 'Demo mode invoice', 12500, '1 Sep', 'due')
     ON CONFLICT (number) DO UPDATE SET status = 'due', paid_at = NULL, payment_ref = NULL, user_id = EXCLUDED.user_id`,
    [invoiceNumber, rows[0].id]);
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  const hash = await hashPassword('password123');
  await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ($1,$2,'member','Demo Member','active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [memberEmail, hash]);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ('demo.admin@example.com',$1,'admin','Demo Admin','active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [hash]);
  await resetInvoice();

  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'demo.admin@example.com', password: 'password123' } }));
  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: memberEmail, password: 'password123' } }));
});

after(async () => {
  await pool.query('DELETE FROM invoices WHERE number = $1', [invoiceNumber]);
  await pool.query("DELETE FROM email_log WHERE to_email LIKE 'demo.%@example.com'");
  await pool.query("DELETE FROM users WHERE email LIKE 'demo.%@example.com'");
  await new Promise((r) => server.close(r));
  await closePool();
});

test('paying offers a demo confirmation while Stripe is not connected', async () => {
  const res = await req(`/api/invoices/${invoiceNumber}/pay`, { method: 'POST', cookie: memberCookie });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.demo, true);
  assert.equal(data.url, undefined, 'no checkout URL is invented');
  assert.match(data.message, /no card/i);
});

test('a demo payment settles the invoice once and is stamped as demo', async () => {
  await resetInvoice();
  const paid = await req(`/api/invoices/${invoiceNumber}/pay/demo`, { method: 'POST', cookie: memberCookie });
  assert.equal(paid.status, 200);
  assert.equal((await paid.json()).demo, true);

  const { rows } = await pool.query('SELECT status, payment_ref, paid_at FROM invoices WHERE number = $1', [invoiceNumber]);
  assert.equal(rows[0].status, 'paid');
  assert.match(rows[0].payment_ref, /^demo-/);
  assert.ok(rows[0].paid_at);

  const again = await req(`/api/invoices/${invoiceNumber}/pay/demo`, { method: 'POST', cookie: memberCookie });
  assert.equal(again.status, 400);
});

test('a member cannot demo-pay somebody else s invoice', async () => {
  await resetInvoice();
  await pool.query('UPDATE invoices SET user_id = (SELECT id FROM users WHERE email = $1) WHERE number = $2',
    ['demo.admin@example.com', invoiceNumber]);
  const res = await req(`/api/invoices/${invoiceNumber}/pay/demo`, { method: 'POST', cookie: memberCookie });
  assert.equal(res.status, 403);
});

test('DEMO_MODE=0 turns the demo path off entirely', async () => {
  await resetInvoice();
  process.env.DEMO_MODE = '0';
  try {
    const pay = await req(`/api/invoices/${invoiceNumber}/pay`, { method: 'POST', cookie: memberCookie });
    assert.equal(pay.status, 503);
    const demo = await req(`/api/invoices/${invoiceNumber}/pay/demo`, { method: 'POST', cookie: memberCookie });
    assert.equal(demo.status, 503);
  } finally {
    delete process.env.DEMO_MODE;
  }
});

test('real Stripe keys take priority over the demo path', async () => {
  await resetInvoice();
  process.env.STRIPE_SECRET_KEY = 'sk_test_not_used_here';
  try {
    const demo = await req(`/api/invoices/${invoiceNumber}/pay/demo`, { method: 'POST', cookie: memberCookie });
    assert.equal(demo.status, 409, 'demo settlement is refused once payments are live');
  } finally {
    delete process.env.STRIPE_SECRET_KEY;
  }
});

test('the outbox lists what the app tried to email, and is admin-only', async () => {
  const { sendEmail } = await import('../server/email.js');
  await sendEmail({ to: memberEmail, subject: 'Demo outbox check', kind: 'test', text: 'hi' });

  const res = await req('/api/admin/outbox', { cookie: adminCookie });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.emailConnected, false);
  assert.ok(data.messages.some((m) => m.subject === 'Demo outbox check' && m.status === 'skipped'));

  const forbidden = await req('/api/admin/outbox', { cookie: memberCookie });
  assert.equal(forbidden.status, 403);
});

test('integration status reports which capabilities are running in demo', async () => {
  const res = await req('/api/admin/integrations', { cookie: adminCookie });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.stripe, false);
  assert.equal(data.email, false);
  assert.equal(data.demo.enabled, true);
  assert.equal(data.demo.payments, true);
  assert.equal(data.demo.email, true);
});
