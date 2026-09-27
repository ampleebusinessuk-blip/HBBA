import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

let server;
let base;
let adminCookie;

async function req(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

const adminReq = (path, options = {}) => req(path, { ...options, cookie: adminCookie });
const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];

async function optedInMember(email) {
  const hash = await hashPassword('password123');
  await query(
    `INSERT INTO users (email, password_hash, role, full_name, status, marketing_opt_in, marketing_opted_in_at)
     VALUES ($1,$2,'member','API Member','active', true, now())
     ON CONFLICT (email) DO UPDATE SET marketing_opt_in = true, marketing_opted_in_at = now(), status = 'active'`,
    [email, hash]);
}

const sentRecipientCount = async (campaignId) => (await query(
  `SELECT count(*)::int AS n FROM campaign_recipients WHERE campaign_id = $1`, [campaignId])).rows[0].n;

async function wipe() {
  await query("DELETE FROM campaign_recipients WHERE lower(email) LIKE '%@api.test'");
  await query("DELETE FROM campaigns WHERE name LIKE 'api test%'");
  await query("DELETE FROM contacts WHERE lower(email) LIKE '%@api.test'");
  await query("DELETE FROM users WHERE lower(email) LIKE '%@api.test' AND email <> 'api.admin@api.test'");
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  const hash = await hashPassword('password123');
  await query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ('api.admin@api.test',$1,'admin','API Admin','active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [hash]);
  await wipe();

  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  adminCookie = cookieOf(await req('/api/auth/login', {
    method: 'POST', body: { email: 'api.admin@api.test', password: 'password123' }
  }));
});

after(async () => {
  await wipe();
  await query("DELETE FROM users WHERE lower(email) LIKE '%@api.test'");
  delete process.env.CRON_SECRET;
  await new Promise((r) => server.close(r));
  await closePool();
});

/* ===================== consent ===================== */

test('a new contact is opted out unless marketing consent is stated', async () => {
  const email = `consent.default.${Date.now()}@api.test`;
  const created = await adminReq('/api/admin/contacts', {
    method: 'POST', body: { name: 'Default Consent', email }
  });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).contact.marketing_opt_in, false);

  const { rows } = await query('SELECT marketing_opt_in, marketing_opted_in_at FROM contacts WHERE email = $1', [email]);
  assert.equal(rows[0].marketing_opt_in, false);
  assert.equal(rows[0].marketing_opted_in_at, null, 'nothing is stamped for a record that never opted in');
});

test('admin explicitly opts a contact into and out of marketing', async () => {
  const email = `consent.toggle.${Date.now()}@api.test`;
  const created = await adminReq('/api/admin/contacts', {
    method: 'POST', body: { name: 'Consent Test', email, marketing_opt_in: true }
  });
  assert.equal((await created.json()).contact.marketing_opt_in, true);
  const { rows: inRows } = await query('SELECT marketing_opted_in_at FROM contacts WHERE email = $1', [email]);
  assert.ok(inRows[0].marketing_opted_in_at, 'opting in is stamped');

  const { rows: found } = await query('SELECT id FROM contacts WHERE email = $1', [email]);
  const updated = await adminReq(`/api/admin/contacts/${found[0].id}`, {
    method: 'PATCH', body: { marketing_opt_in: false }
  });
  assert.equal((await updated.json()).contact.marketing_opt_in, false);
  const { rows: outRows } = await query('SELECT marketing_opted_out_at FROM contacts WHERE email = $1', [email]);
  assert.ok(outRows[0].marketing_opted_out_at, 'opting out is stamped');

  // An unrelated edit must not silently change consent.
  await adminReq(`/api/admin/contacts/${found[0].id}`, { method: 'PATCH', body: { city: 'Leeds' } });
  const { rows: after } = await query('SELECT marketing_opt_in FROM contacts WHERE email = $1', [email]);
  assert.equal(after[0].marketing_opt_in, false, 'consent survives an unrelated update');
});

test('the contact list exposes consent so the audience can be understood', async () => {
  const res = await adminReq('/api/admin/contacts');
  const { contacts } = await res.json();
  assert.ok(contacts.every((c) => typeof c.marketing_opt_in === 'boolean'));
});

test('an invited user is opted out unless consent is stated', async () => {
  const plain = `invite.default.${Date.now()}@api.test`;
  await adminReq('/api/admin/users', { method: 'POST', body: { full_name: 'Invited', email: plain, role: 'member' } });
  const { rows } = await query('SELECT marketing_opt_in FROM users WHERE email = $1', [plain]);
  assert.equal(rows[0].marketing_opt_in, false);

  const opted = `invite.opted.${Date.now()}@api.test`;
  await adminReq('/api/admin/users', {
    method: 'POST', body: { full_name: 'Invited Opted', email: opted, role: 'member', marketing_opt_in: true }
  });
  const { rows: optedRows } = await query('SELECT marketing_opt_in, marketing_opted_in_at FROM users WHERE email = $1', [opted]);
  assert.equal(optedRows[0].marketing_opt_in, true);
  assert.ok(optedRows[0].marketing_opted_in_at);

  const list = await (await adminReq('/api/admin/users')).json();
  assert.ok(list.users.every((u) => typeof u.marketing_opt_in === 'boolean'));
});

/* ===================== campaign authoring ===================== */

test('campaign creation persists authored content', async () => {
  const created = await adminReq('/api/admin/campaigns', {
    method: 'POST',
    body: {
      name: 'api test content', subject: 'Subject line', body_text: 'The message body.',
      segment: 'All members', cta_label: 'Read the news', cta_url: 'https://hbba.example/news'
    }
  });
  assert.equal(created.status, 201);
  const { campaign } = await created.json();
  assert.equal(campaign.status, 'Draft');

  const { rows } = await query('SELECT * FROM campaigns WHERE id = $1', [campaign.id]);
  assert.equal(rows[0].body_text, 'The message body.');
  assert.equal(rows[0].cta_label, 'Read the news');
  assert.equal(rows[0].cta_url, 'https://hbba.example/news');
});

test('a malformed call to action is rejected without persisting anything', async () => {
  const before = (await query("SELECT count(*)::int AS n FROM campaigns WHERE name = 'api test bad cta'")).rows[0].n;
  const res = await adminReq('/api/admin/campaigns', {
    method: 'POST',
    body: {
      name: 'api test bad cta', subject: 'Subject', body_text: 'Body',
      segment: 'All members', cta_label: 'Read'
    }
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /together/);
  const after = (await query("SELECT count(*)::int AS n FROM campaigns WHERE name = 'api test bad cta'")).rows[0].n;
  assert.equal(after, before, 'no partial row is written');

  const missingBody = await adminReq('/api/admin/campaigns', {
    method: 'POST', body: { name: 'api test no body', subject: 'Subject', segment: 'All members' }
  });
  assert.equal(missingBody.status, 400);
});

test('the campaign list reports audiences as eligible of total, and truthful metrics', async () => {
  const res = await adminReq('/api/admin/campaigns');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.audiences.every((a) => typeof a.total === 'number' && typeof a.eligible === 'number'));
  assert.ok(data.audiences.every((a) => a.eligible <= a.total));
  assert.ok(data.campaigns.every((c) => typeof c.delivered === 'number' && typeof c.failed === 'number'));
  assert.ok(data.campaigns.every((c) => 'opened' in c && 'clicked' in c));
});

/* ===================== sending ===================== */

test('sending with no provider connected ends Failed and delivers nothing', async () => {
  await optedInMember(`send.target.${Date.now()}@api.test`);
  const created = await adminReq('/api/admin/campaigns', {
    method: 'POST',
    body: { name: 'api test send', subject: 'Subject', body_text: 'Body', segment: 'All members' }
  });
  const { campaign } = await created.json();

  const sent = await adminReq(`/api/admin/campaigns/${campaign.id}/send`, { method: 'POST' });
  assert.equal(sent.status, 200);
  const result = await sent.json();
  assert.equal(result.status, 'Failed', 'audience size is never reported as delivery');
  assert.equal(result.sent, 0);
  assert.ok(result.eligible >= 1);

  const { rows } = await query('SELECT status FROM campaigns WHERE id = $1', [campaign.id]);
  assert.equal(rows[0].status, 'Failed');

  // A failed campaign can be retried; it is not stuck.
  const retried = await adminReq(`/api/admin/campaigns/${campaign.id}/retry`, { method: 'POST' });
  assert.equal(retried.status, 200);
});

test('a campaign with no eligible recipients is refused', async () => {
  const created = await adminReq('/api/admin/campaigns', {
    method: 'POST',
    body: { name: 'api test empty', subject: 'Subject', body_text: 'Body', segment: 'Gold tier' }
  });
  const { campaign } = await created.json();
  await query("UPDATE users SET marketing_opt_in = false WHERE role = 'member' AND tier = 'Gold'");

  const res = await adminReq(`/api/admin/campaigns/${campaign.id}/send`, { method: 'POST' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /no one|empty|eligible/i);

  const { rows } = await query('SELECT status FROM campaigns WHERE id = $1', [campaign.id]);
  assert.equal(rows[0].status, 'Draft', 'the campaign is left unsent');
});

test('a campaign that already finished cannot be sent again', async () => {
  const { rows } = await query(
    `INSERT INTO campaigns (name, subject, body_text, segment, status)
     VALUES ('api test finished', 'S', 'B', 'All members', 'Sent') RETURNING id`);
  const res = await adminReq(`/api/admin/campaigns/${rows[0].id}/send`, { method: 'POST' });
  assert.equal(res.status, 409);
});

test('campaign endpoints stay admin-only', async () => {
  const res = await req('/api/admin/campaigns', { method: 'GET' });
  assert.equal(res.status, 401);
});

/* ===================== scheduler ===================== */

test('the scheduler route is hidden without a cron secret and refuses a wrong one', async () => {
  delete process.env.CRON_SECRET;
  assert.equal((await req('/api/ops/campaigns/run')).status, 404);

  process.env.CRON_SECRET = 'cron-test-secret';
  try {
    assert.equal((await req('/api/ops/campaigns/run')).status, 401);
    assert.equal((await req('/api/ops/campaigns/run', { headers: { Authorization: 'Bearer nope' } })).status, 401);
    assert.equal((await req('/api/ops/campaigns/run', { headers: { Authorization: 'Bearer cron-test-secre7' } })).status, 401);
    assert.equal((await req('/api/ops/campaigns/run', {
      headers: { Authorization: 'Bearer cron-test-secret' }
    })).status, 200);
  } finally {
    delete process.env.CRON_SECRET;
  }
});

test('the scheduler leaves a campaign alone until it is due', async () => {
  process.env.CRON_SECRET = 'cron-test-secret';
  try {
    await optedInMember(`sched.future.${Date.now()}@api.test`);
    const { rows } = await query(
      `INSERT INTO campaigns (name, subject, body_text, segment, status, scheduled_for)
       VALUES ('api test future', 'S', 'B', 'All members', 'Scheduled', now() + interval '1 hour')
       RETURNING id`);
    const res = await req('/api/ops/campaigns/run', { headers: { Authorization: 'Bearer cron-test-secret' } });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(!data.processed.some((p) => p.campaignId === rows[0].id), 'a future campaign is not touched');

    const after = await query('SELECT status FROM campaigns WHERE id = $1', [rows[0].id]);
    assert.equal(after.rows[0].status, 'Scheduled');
  } finally {
    delete process.env.CRON_SECRET;
  }
});

test('concurrent cron runs claim a due campaign once', async () => {
  process.env.CRON_SECRET = 'cron-test-secret';
  try {
    await optedInMember(`sched.due.${Date.now()}@api.test`);
    const { rows } = await query(
      `INSERT INTO campaigns (name, subject, body_text, segment, status, scheduled_for)
       VALUES ('api test due', 'S', 'B', 'All members', 'Scheduled', now() - interval '1 minute')
       RETURNING id`);
    const campaignId = rows[0].id;

    const headers = { Authorization: 'Bearer cron-test-secret' };
    const [a, b] = await Promise.all([
      req('/api/ops/campaigns/run', { headers }),
      req('/api/ops/campaigns/run', { headers })
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);

    const results = [...(await a.json()).processed, ...(await b.json()).processed]
      .filter((p) => p.campaignId === campaignId);
    assert.equal(results.filter((p) => p.claimed).length, 1, 'exactly one invocation claimed it');

    const eligible = await sentRecipientCount(campaignId);
    assert.ok(eligible >= 1, 'the claimer resolved recipients');

    const { rows: final } = await query('SELECT status FROM campaigns WHERE id = $1', [campaignId]);
    assert.ok(['Sent', 'Partially sent', 'Failed'].includes(final[0].status), 'it reached a terminal state');
  } finally {
    delete process.env.CRON_SECRET;
  }
});
