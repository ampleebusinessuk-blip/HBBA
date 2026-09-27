import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';
import {
  validateCampaignInput, campaignAudience, deliverCampaign, campaignSummary
} from '../server/campaigns.js';

const MARK = 'svc.campaign';
const appUrl = () => 'https://hbba.example';

const baseInput = (over = {}) => ({
  name: 'Service campaign',
  subject: 'Subject line',
  body_text: 'Hello from HBBA.',
  segment: 'All members',
  ...over
});

async function insertUser({ email, role = 'member', marketingOptIn = false, tier = null, status = 'active' }) {
  const hash = await hashPassword('password123');
  await query(
    `INSERT INTO users (email, password_hash, role, full_name, status, tier, marketing_opt_in)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (email) DO UPDATE SET marketing_opt_in = EXCLUDED.marketing_opt_in, tier = EXCLUDED.tier`,
    [email, hash, role, `${MARK} ${email}`, status, tier, marketingOptIn]);
}

async function insertContact({ email, marketingOptIn = false }) {
  await query(
    `INSERT INTO contacts (name, email, marketing_opt_in) VALUES ($1,$2,$3)
     ON CONFLICT (email) DO UPDATE SET marketing_opt_in = EXCLUDED.marketing_opt_in`,
    [`${MARK} contact`, email, marketingOptIn]);
}

async function createCampaign(over = {}) {
  const { rows } = await query(
    `INSERT INTO campaigns (name, subject, body_text, segment, status, cta_label, cta_url, scheduled_for)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [over.name || `${MARK} delivery`, 'Subject', 'Body copy.', over.segment || 'All members',
      over.status || 'Draft', over.cta_label || null, over.cta_url || null, over.scheduled_for || null]);
  return rows[0].id;
}

async function wipe() {
  await query(`DELETE FROM campaign_recipients WHERE email LIKE '%@svc.test'`);
  await query(`DELETE FROM campaigns WHERE name LIKE '${MARK}%'`);
  await query(`DELETE FROM contacts WHERE email LIKE '%@svc.test'`);
  await query(`DELETE FROM users WHERE email LIKE '%@svc.test'`);
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  await wipe();
});

after(async () => {
  await wipe();
  await closePool();
});

/* ===================== validation ===================== */

test('campaign content is required', () => {
  assert.throws(() => validateCampaignInput(baseInput({ name: '  ' }), {}), /name/i);
  assert.throws(() => validateCampaignInput(baseInput({ subject: '' }), {}), /subject/i);
  assert.throws(() => validateCampaignInput(baseInput({ body_text: '   ' }), {}), /message/i);
  assert.throws(() => validateCampaignInput(baseInput({ segment: 'Everyone' }), {}), /audience/i);
});

test('production CTA requires paired fields and https', () => {
  assert.throws(() => validateCampaignInput(baseInput({ cta_label: 'Read' }), { isProduction: true }), /together/);
  assert.throws(() => validateCampaignInput(baseInput({ cta_url: 'https://example.com' }), { isProduction: true }), /together/);
  assert.throws(
    () => validateCampaignInput(baseInput({ cta_label: 'Read', cta_url: 'http://example.com' }), { isProduction: true }),
    /https/);
  assert.throws(
    () => validateCampaignInput(baseInput({ cta_label: 'Read', cta_url: 'not a url' }), { isProduction: true }),
    /https|valid/);

  const dev = validateCampaignInput(baseInput({ cta_label: 'Read', cta_url: 'http://localhost:3000/news' }), { isProduction: false });
  assert.equal(dev.ctaUrl, 'http://localhost:3000/news', 'local http is allowed off production');
});

test('a future send time schedules, everything else is a draft', () => {
  const future = new Date(Date.now() + 3600_000).toISOString();
  assert.equal(validateCampaignInput(baseInput({ scheduled_for: future }), {}).status, 'Scheduled');
  assert.equal(validateCampaignInput(baseInput(), {}).status, 'Draft');
  assert.equal(validateCampaignInput(baseInput({ scheduled_for: '' }), {}).status, 'Draft');
  assert.throws(
    () => validateCampaignInput(baseInput({ scheduled_for: new Date(Date.now() - 3600_000).toISOString() }), {}),
    /future/);
  assert.throws(() => validateCampaignInput(baseInput({ scheduled_for: 'tomorrow-ish' }), {}), /valid/);
});

/* ===================== audience ===================== */

test('audience includes opted-in recipients once and excludes opted-out records', async () => {
  await insertUser({ email: 'DUP@svc.test', role: 'member', marketingOptIn: true });
  await insertContact({ email: 'dup@svc.test', marketingOptIn: true });
  await insertUser({ email: 'out@svc.test', role: 'member', marketingOptIn: false });

  const recipients = await campaignAudience('All members', { query });
  const ours = recipients.filter((r) => r.email.endsWith('@svc.test'));
  assert.deepEqual(ours.map((r) => r.email), ['dup@svc.test'], 'normalised, de-duplicated, consent-filtered');
});

test('every segment counts only opted-in records', async () => {
  await insertUser({ email: 'gold@svc.test', role: 'member', tier: 'Gold', marketingOptIn: true });
  await insertUser({ email: 'goldout@svc.test', role: 'member', tier: 'Gold', marketingOptIn: false });
  await insertUser({ email: 'sponsor@svc.test', role: 'sponsor', marketingOptIn: true });
  await insertContact({ email: 'contact@svc.test', marketingOptIn: true });

  const gold = await campaignAudience('Gold tier', { query });
  assert.ok(gold.some((r) => r.email === 'gold@svc.test'));
  assert.ok(!gold.some((r) => r.email === 'goldout@svc.test'));

  const sponsors = await campaignAudience('Sponsors', { query });
  assert.ok(sponsors.some((r) => r.email === 'sponsor@svc.test'));

  const contacts = await campaignAudience('Contacts', { query });
  assert.ok(contacts.some((r) => r.email === 'contact@svc.test'));

  assert.deepEqual(await campaignAudience('Nonsense', { query }), []);
});

/* ===================== delivery ===================== */

/* Delivery cases share the member audience, so they run in order inside one
   parent test and each starts from a clean slate. */
test('campaign delivery', async (t) => {
  const reset = async () => { await wipe(); };

  await reset();
  await t.test('delivery sends to every eligible recipient once and reports Sent', async () => {
    await insertUser({ email: 'a@svc.test', marketingOptIn: true });
    await insertUser({ email: 'b@svc.test', marketingOptIn: true });
    const campaignId = await createCampaign();
  
    const attempts = [];
    const result = await deliverCampaign(campaignId, {
      query,
      send: async ({ to, html, text }) => {
        attempts.push({ to, html, text });
        return { sent: true, skipped: false, id: `provider-${to}` };
      },
      appUrl
    });
  
    assert.equal(result.status, 'Sent');
    assert.equal(result.sent, 2);
    assert.equal(result.failed, 0);
    assert.equal(result.eligible, 2);
    assert.deepEqual(attempts.map((a) => a.to).sort(), ['a@svc.test', 'b@svc.test']);
  
    const mail = attempts[0];
    assert.match(mail.html, /\/api\/campaigns\/open\/[A-Za-z0-9_-]+\.gif/, 'open pixel is embedded');
    assert.match(mail.html, /\/unsubscribe\/[A-Za-z0-9_-]+/, 'unsubscribe link is present');
    assert.match(mail.text, /unsubscribe/i, 'the text part carries it too');
  
    const again = await deliverCampaign(campaignId, {
      query, send: async () => { throw new Error('must not send twice'); }, appUrl
    });
    assert.equal(again.sent, 2, 'already-sent recipients are counted, not resent');
    assert.equal(again.status, 'Sent');
  });
  
  await reset();
  await t.test('partial delivery retries only failed recipients', async () => {
    await insertUser({ email: 'ok@svc.test', marketingOptIn: true });
    await insertUser({ email: 'fail@svc.test', marketingOptIn: true });
    const campaignId = await createCampaign();
  
    const attempts = [];
    const first = await deliverCampaign(campaignId, {
      query,
      send: async ({ to }) => {
        attempts.push(to);
        return to === 'fail@svc.test'
          ? { sent: false, skipped: false, error: 'provider rejected' }
          : { sent: true, skipped: false, id: `provider-${to}` };
      },
      appUrl
    });
    assert.equal(first.status, 'Partially sent');
    assert.equal(first.sent, 1);
    assert.equal(first.failed, 1);
  
    attempts.length = 0;
    const retry = await deliverCampaign(campaignId, {
      query,
      send: async ({ to }) => {
        attempts.push(to);
        return { sent: true, skipped: false, id: `retry-${to}` };
      },
      appUrl
    });
    assert.deepEqual(attempts, ['fail@svc.test'], 'only the failure is retried');
    assert.equal(retry.status, 'Sent');
    assert.equal(retry.sent, 2);
  });
  
  await reset();
  await t.test('with no provider connected every recipient is skipped and the campaign fails', async () => {
    await insertUser({ email: 'nobody@svc.test', marketingOptIn: true });
    const campaignId = await createCampaign();
  
    const result = await deliverCampaign(campaignId, {
      query, send: async () => ({ sent: false, skipped: true }), appUrl
    });
    assert.equal(result.status, 'Failed');
    assert.equal(result.sent, 0);
    assert.equal(result.skipped, 1);
  
    const { rows } = await query('SELECT status, completed_at FROM campaigns WHERE id = $1', [campaignId]);
    assert.equal(rows[0].status, 'Failed');
    assert.ok(rows[0].completed_at, 'a terminal state records when it finished');
  });
  
  await reset();
  await t.test('an empty eligible audience leaves the campaign unsent', async () => {
    await insertUser({ email: 'optedout@svc.test', marketingOptIn: false });
    const campaignId = await createCampaign();
  
    const result = await deliverCampaign(campaignId, {
      query, send: async () => { throw new Error('must not send'); }, appUrl
    });
    assert.equal(result.empty, true);
    assert.equal(result.eligible, 0);
  
    const { rows } = await query('SELECT status FROM campaigns WHERE id = $1', [campaignId]);
    assert.equal(rows[0].status, 'Draft', 'the campaign is returned to its previous state');
  });
  
  await reset();
  await t.test('a scheduled campaign is only claimed once it is due', async () => {
    await insertUser({ email: 'sched@svc.test', marketingOptIn: true });
    const future = await createCampaign({
      status: 'Scheduled', scheduled_for: new Date(Date.now() + 3600_000).toISOString()
    });
  
    const early = await deliverCampaign(future, {
      query, send: async () => { throw new Error('must not send'); }, appUrl
    });
    assert.equal(early.claimed, false, 'a future campaign is not claimed');
    assert.equal(early.status, 'Scheduled');
  
    const due = await createCampaign({
      status: 'Scheduled', scheduled_for: new Date(Date.now() - 60_000).toISOString()
    });
    const ran = await deliverCampaign(due, {
      query, send: async ({ to }) => ({ sent: true, skipped: false, id: to }), appUrl
    });
    assert.equal(ran.status, 'Sent');
  });
  
  await reset();
  await t.test('concurrent delivery of one campaign sends each recipient once', async () => {
    await insertUser({ email: 'race@svc.test', marketingOptIn: true });
    const campaignId = await createCampaign();
  
    const attempts = [];
    const send = async ({ to }) => {
      attempts.push(to);
      await new Promise((r) => setTimeout(r, 30));
      return { sent: true, skipped: false, id: `p-${to}` };
    };
    const [a, b] = await Promise.all([
      deliverCampaign(campaignId, { query, send, appUrl }),
      deliverCampaign(campaignId, { query, send, appUrl })
    ]);
  
    assert.equal(attempts.length, 1, 'only one invocation claimed the campaign');
    assert.ok([a, b].some((r) => r.status === 'Sent'));
    assert.ok([a, b].some((r) => r.claimed === false), 'the loser reports it did not claim');
  });
  
  await reset();
  await t.test('the campaign summary counts distinct opens and clicks', async () => {
    await insertUser({ email: 'seen@svc.test', marketingOptIn: true });
    const campaignId = await createCampaign();
    await deliverCampaign(campaignId, {
      query, send: async ({ to }) => ({ sent: true, skipped: false, id: to }), appUrl
    });
  
    await query(
      `UPDATE campaign_recipients SET first_opened_at = now(), first_clicked_at = now()
        WHERE campaign_id = $1`, [campaignId]);
  
    const summary = await campaignSummary(campaignId, { query });
    assert.equal(summary.eligible, 1);
    assert.equal(summary.sent, 1);
    assert.equal(summary.opened, 1);
    assert.equal(summary.clicked, 1);
  });
});
