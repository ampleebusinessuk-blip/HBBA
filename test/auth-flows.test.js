import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';
import { verifySignature, settleInvoice } from '../server/routes/stripe.js';
import { googleAuthUrl, googleConfigured } from '../server/google.js';
import { emailConfigured, deliverySummary } from '../server/email.js';

let server;
let base;
let adminCookie;
const userEmail = 'flow.member@example.com';
const invoiceNumber = 'FLOW-INV-1';

async function req(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      ...(body && typeof body === 'object' ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    redirect: 'manual'
  });
}

const cookieHeaders = (res) => res.headers.getSetCookie?.() || [res.headers.get('set-cookie')].filter(Boolean);
const cookieOf = (res) => (cookieHeaders(res)[0] || '').split(';')[0];

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }

  const hash = await hashPassword('password123');
  await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ($1,$2,'member','Flow Member','active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'`,
    [userEmail, hash]);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ('flow.admin@example.com',$1,'admin','Flow Admin','active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [hash]);
  await pool.query(
    `INSERT INTO invoices (number, description, amount_cents, issued_on, status)
     VALUES ($1, 'Flow test invoice', 5000, '1 Sep', 'due')
     ON CONFLICT (number) DO UPDATE SET status = 'due', paid_at = NULL, payment_ref = NULL`,
    [invoiceNumber]);

  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'flow.admin@example.com', password: 'password123' } }));
});

after(async () => {
  await pool.query("DELETE FROM email_log WHERE to_email LIKE 'flow.%@example.com' OR to_email LIKE 'invite.flow%'");
  await pool.query("DELETE FROM invoices WHERE number = $1", [invoiceNumber]);
  await pool.query("DELETE FROM users WHERE email LIKE 'flow.%@example.com' OR email LIKE 'invite.flow%'");
  await new Promise((r) => server.close(r));
  await closePool();
});

test('forgot password answers the same way for known and unknown emails', async () => {
  const known = await req('/api/auth/forgot', { method: 'POST', body: { email: userEmail } });
  const unknown = await req('/api/auth/forgot', { method: 'POST', body: { email: 'nobody.here@example.com' } });
  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200);
  const [a, b] = [await known.json(), await unknown.json()];
  assert.equal(a.message, b.message);

  const bad = await req('/api/auth/forgot', { method: 'POST', body: { email: 'not-an-email' } });
  assert.equal(bad.status, 400);
});

test('a reset token sets a new password once, then stops working', async () => {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
  const { createResetLink } = await import('../server/tokens.js');
  const { token } = await createResetLink(rows[0].id, 'reset');

  const short = await req('/api/auth/reset', { method: 'POST', body: { token, password: 'short' } });
  assert.equal(short.status, 400);

  const ok = await req('/api/auth/reset', { method: 'POST', body: { token, password: 'brand-new-password' } });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).user.email, userEmail);

  const replay = await req('/api/auth/reset', { method: 'POST', body: { token, password: 'another-password' } });
  assert.equal(replay.status, 400);

  const login = await req('/api/auth/login', { method: 'POST', body: { email: userEmail, password: 'brand-new-password' } });
  assert.equal(login.status, 200);
});

test('an expired token is refused', async () => {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
  const { createResetLink } = await import('../server/tokens.js');
  const { token } = await createResetLink(rows[0].id, 'reset');
  await pool.query("UPDATE password_resets SET expires_at = now() - INTERVAL '1 minute' WHERE used_at IS NULL AND user_id = $1", [rows[0].id]);
  const res = await req('/api/auth/reset', { method: 'POST', body: { token, password: 'yet-another-password' } });
  assert.equal(res.status, 400);
});

test('remember me controls whether the cookie survives the browser session', async () => {
  const remembered = await req('/api/auth/login', { method: 'POST', body: { email: userEmail, password: 'brand-new-password', remember: true } });
  const session = await req('/api/auth/login', { method: 'POST', body: { email: userEmail, password: 'brand-new-password', remember: false } });
  assert.match(cookieHeaders(remembered)[0], /Max-Age=|Expires=/i);
  assert.doesNotMatch(cookieHeaders(session)[0], /Max-Age=|Expires=/i);
});

test('a suspended account cannot sign in', async () => {
  await pool.query("UPDATE users SET status = 'suspended' WHERE email = $1", [userEmail]);
  const res = await req('/api/auth/login', { method: 'POST', body: { email: userEmail, password: 'brand-new-password' } });
  assert.equal(res.status, 403);
  await pool.query("UPDATE users SET status = 'active' WHERE email = $1", [userEmail]);
});

test('providers endpoint reports what this deployment supports', async () => {
  const res = await req('/api/auth/providers');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.google, googleConfigured());
  assert.equal(data.email, emailConfigured());
});

test('google sign-in is refused while unconfigured, and builds a valid consent URL when set', async () => {
  const res = await req('/api/auth/google');
  assert.equal(res.status, googleConfigured() ? 302 : 503);

  process.env.GOOGLE_CLIENT_ID = 'test-client';
  process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
  process.env.GOOGLE_REDIRECT_URI = 'https://example.test/api/auth/google/callback';
  try {
    const url = new URL(googleAuthUrl('state-123'));
    assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
    assert.equal(url.searchParams.get('client_id'), 'test-client');
    assert.equal(url.searchParams.get('state'), 'state-123');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://example.test/api/auth/google/callback');
    assert.equal(url.searchParams.get('response_type'), 'code');
  } finally {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
  }
});

test('an invited user gets a pending account and a working set-password link', async () => {
  const email = `invite.flow.${Date.now()}@example.com`;
  const res = await req('/api/admin/users', {
    method: 'POST', cookie: adminCookie, body: { full_name: 'Invited Person', email, role: 'member' }
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.emailConnected, emailConfigured());

  const { rows } = await pool.query('SELECT id, status FROM users WHERE email = $1', [email]);
  assert.equal(rows[0].status, 'pending');
  const tokens = await pool.query("SELECT purpose FROM password_resets WHERE user_id = $1", [rows[0].id]);
  assert.equal(tokens.rows[0].purpose, 'invite');

  assert.ok(body.invite_link, 'link is returned to the admin while email is not connected');
  const token = new URL(body.invite_link.replace('/#reset?', '/reset?')).searchParams.get('token');
  const accepted = await req('/api/auth/reset', { method: 'POST', body: { token, password: 'invited-user-password' } });
  assert.equal(accepted.status, 200);

  const after = await pool.query('SELECT status FROM users WHERE email = $1', [email]);
  assert.equal(after.rows[0].status, 'active');
});

test('an admin can issue a reset link for an existing user', async () => {
  const res = await req(`/api/admin/users/${encodeURIComponent(userEmail)}/reset-link`, { method: 'POST', cookie: adminCookie });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.emailConnected, emailConfigured());

  if (!emailConfigured()) {
    assert.ok(data.link, 'the link is handed back when it cannot be emailed');
    const token = new URL(data.link.replace('/#reset?', '/reset?')).searchParams.get('token');
    const used = await req('/api/auth/reset', { method: 'POST', body: { token, password: 'admin-issued-password' } });
    assert.equal(used.status, 200);
  }

  const missing = await req('/api/admin/users/nobody@example.com/reset-link', { method: 'POST', cookie: adminCookie });
  assert.equal(missing.status, 404);
});

test('every send is recorded, and is skipped while no provider is connected', async () => {
  const { sendEmail } = await import('../server/email.js');
  const out = await sendEmail({ to: userEmail, subject: 'Flow test', kind: 'test', text: 'hello' });
  const { rows } = await pool.query(
    'SELECT status, kind FROM email_log WHERE to_email = $1 ORDER BY created_at DESC LIMIT 1', [userEmail]);
  assert.equal(rows[0].kind, 'test');
  if (emailConfigured()) assert.equal(out.sent, true);
  else {
    assert.equal(out.skipped, true);
    assert.equal(rows[0].status, 'skipped');
  }
  assert.match(deliverySummary({ sent: 0, skipped: 3, failed: 0, total: 3 }), /recorded|delivered/);
});

test('stripe webhook rejects a bad signature and settles an invoice on a good one', async () => {
  const secret = 'whsec_test_secret';
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  try {
    const payload = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { metadata: { invoice_number: invoiceNumber }, payment_intent: 'pi_test_123' } }
    });
    const ts = Math.floor(Date.now() / 1000);
    const sign = (body, t = ts, key = secret) =>
      `t=${t},v1=${createHmac('sha256', key).update(`${t}.${body}`).digest('hex')}`;

    assert.equal(verifySignature(Buffer.from(payload), sign(payload), secret), true);
    assert.equal(verifySignature(Buffer.from(payload), sign(payload, ts, 'wrong_secret'), secret), false);
    assert.equal(verifySignature(Buffer.from(payload), sign(payload, ts - 3600), secret), false, 'old timestamps are rejected');

    const bad = await req('/api/stripe/webhook', {
      method: 'POST', body: payload,
      headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 't=1,v1=deadbeef' }
    });
    assert.equal(bad.status, 400);

    const good = await req('/api/stripe/webhook', {
      method: 'POST', body: payload,
      headers: { 'Content-Type': 'application/json', 'Stripe-Signature': sign(payload) }
    });
    assert.equal(good.status, 200);

    const { rows } = await pool.query('SELECT status, payment_ref FROM invoices WHERE number = $1', [invoiceNumber]);
    assert.equal(rows[0].status, 'paid');
    assert.equal(rows[0].payment_ref, 'pi_test_123');

    // Replaying the same event must not double-settle.
    assert.equal(await settleInvoice(invoiceNumber, 'pi_other'), null);
  } finally {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  }
});

test('the webhook is unavailable while no signing secret is set', async () => {
  const res = await req('/api/stripe/webhook', {
    method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }
  });
  assert.equal(res.status, 503);
});
