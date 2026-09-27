import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool, closePool } from '../server/db.js';

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
});

after(async () => {
  await pool.query("DELETE FROM campaigns WHERE name LIKE 'schema test%'");
  await closePool();
});

test('campaign schema stores consent, content and idempotent recipients', async () => {
  const columns = await pool.query(`
    SELECT table_name, column_name, column_default, is_nullable
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN ('users', 'contacts', 'campaigns', 'campaign_recipients')`);
  const key = new Set(columns.rows.map((r) => `${r.table_name}.${r.column_name}`));
  for (const name of [
    'users.marketing_opt_in', 'users.marketing_opted_in_at', 'users.marketing_opted_out_at',
    'contacts.marketing_opt_in', 'contacts.marketing_opted_in_at', 'contacts.marketing_opted_out_at',
    'campaigns.body_text', 'campaigns.cta_label', 'campaigns.cta_url',
    'campaigns.started_at', 'campaigns.completed_at', 'campaigns.failed_count', 'campaigns.last_error',
    'campaign_recipients.campaign_id', 'campaign_recipients.email', 'campaign_recipients.public_token',
    'campaign_recipients.delivery_status', 'campaign_recipients.first_opened_at', 'campaign_recipients.first_clicked_at'
  ]) assert.ok(key.has(name), `missing ${name}`);

  await assert.rejects(
    pool.query("INSERT INTO campaigns (name, status) VALUES ('bad status', 'Unknown')"),
    /campaigns_status_check/
  );
});

test('consent defaults to opted out on both record types', async () => {
  const { rows } = await pool.query(`
    SELECT table_name, column_default, is_nullable
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND column_name = 'marketing_opt_in'`);
  assert.equal(rows.length, 2, 'both users and contacts carry the flag');
  for (const row of rows) {
    assert.match(row.column_default, /false/, `${row.table_name} defaults to opted out`);
    assert.equal(row.is_nullable, 'NO', `${row.table_name}.marketing_opt_in is not nullable`);
  }
});

test('a campaign accepts every delivery status the pipeline can reach', async () => {
  for (const status of ['Draft', 'Scheduled', 'Sending', 'Sent', 'Partially sent', 'Failed']) {
    await pool.query('INSERT INTO campaigns (name, status) VALUES ($1, $2)', [`schema test ${status}`, status]);
  }
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM campaigns WHERE name LIKE 'schema test%'");
  assert.equal(rows[0].n, 6);
});

test('recipients are unique per campaign and carry a unique token', async () => {
  const { rows: campaign } = await pool.query(
    "INSERT INTO campaigns (name, status) VALUES ('schema test recipients', 'Draft') RETURNING id");
  const campaignId = campaign[0].id;

  await pool.query(
    `INSERT INTO campaign_recipients (campaign_id, email, display_name, public_token)
     VALUES ($1, 'one@example.test', 'One', 'token-schema-1')`, [campaignId]);

  const { rows: defaults } = await pool.query(
    'SELECT delivery_status FROM campaign_recipients WHERE public_token = $1', ['token-schema-1']);
  assert.equal(defaults[0].delivery_status, 'pending', 'recipients start pending');

  await assert.rejects(
    pool.query(
      `INSERT INTO campaign_recipients (campaign_id, email, public_token)
       VALUES ($1, 'one@example.test', 'token-schema-2')`, [campaignId]),
    /duplicate key/, 'the same address cannot be added to one campaign twice');

  await assert.rejects(
    pool.query(
      `INSERT INTO campaign_recipients (campaign_id, email, public_token)
       VALUES ($1, 'two@example.test', 'token-schema-1')`, [campaignId]),
    /duplicate key/, 'tokens are globally unique');

  await assert.rejects(
    pool.query(
      `INSERT INTO campaign_recipients (campaign_id, email, public_token, delivery_status)
       VALUES ($1, 'three@example.test', 'token-schema-3', 'posted')`, [campaignId]),
    /campaign_recipients_delivery_status_check/, 'delivery status is constrained');

  const { rows: indexes } = await pool.query(
    "SELECT indexdef FROM pg_indexes WHERE tablename = 'campaign_recipients'");
  assert.ok(
    indexes.some((i) => /campaign_id.*delivery_status/.test(i.indexdef)),
    'the delivery worker has an index to select pending rows');

  await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);
  const { rows: cascaded } = await pool.query(
    'SELECT count(*)::int AS n FROM campaign_recipients WHERE campaign_id = $1', [campaignId]);
  assert.equal(cascaded[0].n, 0, 'recipients are removed with their campaign');
});
