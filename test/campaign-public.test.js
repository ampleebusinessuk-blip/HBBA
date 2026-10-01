import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

let server;
let base;
let campaignId;
let token;
const email = 'tracked@pub.test';

async function req(path, { method = 'GET', redirect = 'follow' } = {}) {
  return fetch(base + path, { method, redirect });
}

const recipient = async () => (await query(
  'SELECT first_opened_at, first_clicked_at FROM campaign_recipients WHERE public_token = $1', [token])).rows[0];

async function wipe() {
  // One fixture is stored upper-case on purpose, so clean up case-insensitively.
  await query("DELETE FROM campaign_recipients WHERE lower(email) LIKE '%@pub.test'");
  await query("DELETE FROM campaigns WHERE name LIKE 'pub test%'");
  await query("DELETE FROM contacts WHERE lower(email) LIKE '%@pub.test'");
  await query("DELETE FROM users WHERE lower(email) LIKE '%@pub.test'");
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  await wipe();

  const hash = await hashPassword('password123');
  // The same address held twice: unsubscribing must suppress both records.
  await query(
    `INSERT INTO users (email, password_hash, role, full_name, status, marketing_opt_in, marketing_opted_in_at)
     VALUES ($1,$2,'member','Tracked Member','active', true, now())`, [email, hash]);
  await query(
    `INSERT INTO contacts (name, email, marketing_opt_in, marketing_opted_in_at)
     VALUES ('Tracked Contact', $1, true, now())`, [email.toUpperCase()]);

  const { rows: campaign } = await query(
    `INSERT INTO campaigns (name, subject, body_text, segment, status, cta_label, cta_url)
     VALUES ('pub test campaign', 'Subject', 'Body', 'All members', 'Sent', 'Read the news', 'https://hbba.example/news')
     RETURNING id`);
  campaignId = campaign[0].id;

  token = 'public-token-for-tracking-tests';
  await query(
    `INSERT INTO campaign_recipients (campaign_id, email, display_name, public_token, delivery_status, sent_at)
     VALUES ($1, $2, 'Tracked Member', $3, 'sent', now())`, [campaignId, email, token]);

  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await wipe();
  await new Promise((r) => server.close(r));
  await closePool();
});

test('the open pixel records the first open and is never cached', async () => {
  const res = await req(`/api/campaigns/open/${token}.gif`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/gif');
  assert.match(res.headers.get('cache-control'), /no-store/);
  assert.match(res.headers.get('cache-control'), /private/);
  const body = Buffer.from(await res.arrayBuffer());
  assert.equal(body.subarray(0, 3).toString('ascii'), 'GIF', 'a real transparent GIF is returned');

  const first = (await recipient()).first_opened_at;
  assert.ok(first, 'the first open is recorded');

  await new Promise((r) => setTimeout(r, 25));
  await req(`/api/campaigns/open/${token}.gif`);
  assert.equal((await recipient()).first_opened_at.getTime(), first.getTime(), 'a second open does not move the first');
});

test('an unknown open token still returns a pixel and reveals nothing', async () => {
  const res = await req('/api/campaigns/open/not-a-real-token.gif');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/gif');
});

test('click redirects only to the campaign CTA and counts once', async () => {
  const first = await req(`/api/campaigns/click/${token}?url=https://evil.example`, { redirect: 'manual' });
  assert.equal(first.status, 302);
  assert.equal(first.headers.get('location'), 'https://hbba.example/news', 'the request cannot choose the destination');

  const firstClick = (await recipient()).first_clicked_at;
  assert.ok(firstClick);

  await new Promise((r) => setTimeout(r, 25));
  await req(`/api/campaigns/click/${token}`, { redirect: 'manual' });
  assert.equal((await recipient()).first_clicked_at.getTime(), firstClick.getTime(), 'clicks count distinct recipients');

  const { rows } = await query(
    `SELECT count(*) FILTER (WHERE first_clicked_at IS NOT NULL)::int AS clicked
       FROM campaign_recipients WHERE campaign_id = $1`, [campaignId]);
  assert.equal(rows[0].clicked, 1);
});

test('an unknown click token lands on the portal rather than erroring', async () => {
  const res = await req('/api/campaigns/click/nope', { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.ok(res.headers.get('location'), 'there is somewhere neutral to go');
  assert.ok(!res.headers.get('location').includes('nope'));
});

test('the unsubscribe page renders a confirmation form without authentication', async () => {
  const res = await req(`/unsubscribe/${token}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /<form[^>]+method="post"/i);
  assert.match(html, new RegExp(`/api/campaigns/unsubscribe/${token}`));
  assert.ok(!html.includes(email), 'the page does not print the address back');
});

test('unsubscribe suppresses every matching record and is idempotent', async () => {
  const first = await req(`/api/campaigns/unsubscribe/${token}`, { method: 'POST' });
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { ok: true, message: 'You are unsubscribed from marketing emails.' });

  await req(`/api/campaigns/unsubscribe/${token}`, { method: 'POST' });

  const users = await query('SELECT marketing_opt_in, marketing_opted_out_at FROM users WHERE lower(email) = lower($1)', [email]);
  const contacts = await query('SELECT marketing_opt_in, marketing_opted_out_at FROM contacts WHERE lower(email) = lower($1)', [email]);
  const rows = [...users.rows, ...contacts.rows];
  assert.equal(rows.length, 2, 'both records for the address were found');
  assert.ok(rows.every((r) => r.marketing_opt_in === false), 'every matching record is suppressed');
  assert.ok(rows.every((r) => r.marketing_opted_out_at), 'the opt-out time is stamped');
});

test('an unknown unsubscribe token answers exactly like a known one', async () => {
  const known = await req(`/api/campaigns/unsubscribe/${token}`, { method: 'POST' });
  const unknown = await req('/api/campaigns/unsubscribe/some-token-that-does-not-exist', { method: 'POST' });
  assert.equal(unknown.status, known.status);
  assert.deepEqual(await unknown.json(), await known.json());
});

test('an unsubscribed address drops out of the campaign audience', async () => {
  const { campaignAudience } = await import('../server/campaigns.js');
  const audience = await campaignAudience('All members', { query });
  assert.ok(!audience.some((r) => r.email === email), 'suppression takes effect immediately');
});
