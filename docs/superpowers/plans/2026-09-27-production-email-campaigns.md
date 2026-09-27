# Production Email Campaigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver consent-safe, authored, scheduled, tracked, retryable email campaigns while keeping Resend credentials as deployment-only configuration.

**Architecture:** PostgreSQL stores consent, campaign content, and one idempotent delivery row per recipient. A focused campaign service owns audience resolution and delivery state; authenticated admin routes and a protected cron route call that same service, while a separate public router handles opaque tracking and unsubscribe tokens. The vanilla frontend consumes truthful campaign/audience state and never infers delivery from audience size.

**Tech Stack:** Node.js 20+ ESM, Express 4, PostgreSQL 16+, Node test runner, vanilla HTML/CSS/JavaScript, Vercel Cron, existing Resend REST adapter

**Spec:** `docs/superpowers/specs/2026-09-27-production-email-campaigns-design.md`

## Global Constraints

- Existing users and contacts default to marketing opt-out.
- Marketing consent applies only to campaigns; transactional email remains unaffected.
- Campaign message input is plain text and is HTML-escaped by the server.
- Public tracking tokens contain no email address or campaign data.
- Delivery is idempotent: an already-sent campaign recipient is never sent twice.
- Opens and clicks count distinct recipients and opens are labelled estimated.
- Scheduled delivery requires `CRON_SECRET`; live delivery still requires `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_URL`.
- No new runtime package is required.

## Review Focus

- The same email in both `users` and `contacts` receives one campaign message; pin this in Task 2.
- A campaign with a malformed or non-HTTPS CTA is rejected without persisting partial data; pin this in Task 4.
- Two scheduler invocations racing for one due campaign produce one set of sends; pin this in Task 4.
- Unsubscribing an email represented by multiple records opts out every matching record without revealing account existence; pin this in Task 3.
- A provider failure after some successful recipients preserves successes and exposes a retry that sends only failed recipients; pin this in Task 2.

---

### Task 1: Campaign And Consent Schema

**Files:**
- Create: `migrations/014_production_campaigns.sql`
- Create: `test/campaign-schema.test.js`

**Interfaces:**
- Produces: consent columns on `users` and `contacts`; campaign content/state columns; `campaign_recipients` table used by Tasks 2-6.
- Produces statuses: `Draft | Scheduled | Sending | Sent | Partially sent | Failed` and recipient states `pending | sent | failed | skipped`.

- [ ] **Step 1: Write the failing schema test**

Create a Node test that runs migrations and asserts the new columns, defaults, constraints, and indexes through `information_schema` and `pg_indexes`:

```js
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
    pool.query(`INSERT INTO campaigns (name, status) VALUES ('bad status', 'Unknown')`),
    /campaigns_status_check/
  );
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test test/campaign-schema.test.js`

Expected: FAIL because the consent columns and `campaign_recipients` do not exist.

- [ ] **Step 3: Add the migration**

Use `ADD COLUMN IF NOT EXISTS`, replace `campaigns_status_check`, and create:

```sql
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email            text NOT NULL,
  display_name     text,
  public_token     text NOT NULL UNIQUE,
  delivery_status  text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_id      text,
  error            text,
  sent_at          timestamptz,
  first_opened_at  timestamptz,
  first_clicked_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, email)
);
CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_idx
  ON campaign_recipients (campaign_id, delivery_status);
```

Use `lower(email)` before inserts in application code; PostgreSQL's unique constraint then receives normalized addresses.

- [ ] **Step 4: Apply migrations and verify GREEN**

Run: `npm run migrate && node --test test/campaign-schema.test.js`

Expected: PASS with the migration listed as applied once; a second `npm run migrate` reports up to date.

- [ ] **Step 5: Commit**

```bash
git add migrations/014_production_campaigns.sql test/campaign-schema.test.js
git commit -m "feat: add campaign delivery and consent schema"
```

---

### Task 2: Idempotent Campaign Delivery Service

**Files:**
- Create: `server/campaigns.js`
- Modify: `server/email.js`
- Create: `test/campaign-service.test.js`

**Interfaces:**
- Consumes: schema from Task 1; `sendEmail({ to, subject, html, text, kind })` from `server/email.js`.
- Produces: `validateCampaignInput(input, { isProduction })`, `campaignAudience(segment, deps)`, `deliverCampaign(campaignId, deps)`, and `campaignSummary(campaignId, deps)`.
- `deliverCampaign` returns `{ campaignId, status, eligible, sent, failed, skipped }`.

- [ ] **Step 1: Write failing validation and audience tests**

Test required fields, paired CTA fields, production HTTPS validation, consent filtering, lowercase de-duplication, and the Review Focus duplicate-email case:

```js
test('audience includes opted-in recipients once and excludes opted-out records', async () => {
  await insertUser({ email: 'DUP@example.com', role: 'member', marketingOptIn: true });
  await insertContact({ email: 'dup@example.com', marketingOptIn: true });
  await insertUser({ email: 'out@example.com', role: 'member', marketingOptIn: false });
  const recipients = await campaignAudience('All members', { query });
  assert.deepEqual(recipients.map((r) => r.email), ['dup@example.com']);
});

test('production CTA requires paired fields and https', () => {
  assert.throws(() => validateCampaignInput(baseInput({ cta_label: 'Read' }), { isProduction: true }), /together/);
  assert.throws(() => validateCampaignInput(baseInput({ cta_label: 'Read', cta_url: 'http://example.com' }), { isProduction: true }), /https/);
});
```

- [ ] **Step 2: Run validation/audience tests and verify RED**

Run: `node --test test/campaign-service.test.js --test-name-pattern="audience|CTA"`

Expected: FAIL because `server/campaigns.js` does not exist.

- [ ] **Step 3: Implement validation and audience resolution**

Define segment SQL that always includes `marketing_opt_in = true`, normalizes emails with `lower(trim(email))`, excludes blank addresses, and de-duplicates by normalized email. `validateCampaignInput` returns:

```js
{
  name, subject, bodyText, segment,
  ctaLabel: ctaLabel || null,
  ctaUrl: ctaUrl || null,
  scheduledFor: scheduledDateOrNull,
  status: scheduledDateOrNull ? 'Scheduled' : 'Draft'
}
```

- [ ] **Step 4: Write failing delivery-state tests**

Inject a deterministic `send` function. Assert complete success, total failure without a provider, partial failure, retry, and no duplicate send:

```js
test('partial delivery retries only failed recipients', async () => {
  const attempts = [];
  const first = await deliverCampaign(campaignId, {
    query,
    send: async ({ to }) => {
      attempts.push(to);
      return to === 'fail@example.com'
        ? { sent: false, skipped: false, error: 'provider rejected' }
        : { sent: true, skipped: false, id: `provider-${to}` };
    },
    appUrl: () => 'https://hbba.example'
  });
  assert.equal(first.status, 'Partially sent');
  assert.equal(first.sent, 1);

  attempts.length = 0;
  const retry = await deliverCampaign(campaignId, {
    query,
    send: async ({ to }) => ({ sent: true, skipped: false, id: `retry-${to}` }),
    appUrl: () => 'https://hbba.example'
  });
  assert.deepEqual(attempts, ['fail@example.com']);
  assert.equal(retry.status, 'Sent');
});
```

- [ ] **Step 5: Run delivery tests and verify RED**

Run: `node --test test/campaign-service.test.js --test-name-pattern="delivery|retry|provider"`

Expected: FAIL because `deliverCampaign` is not implemented.

- [ ] **Step 6: Implement idempotent delivery**

Use a transaction to lock the campaign, permit `Draft`, due `Scheduled`, `Partially sent`, or `Failed`, set `Sending`, resolve/upsert recipients with `randomBytes(32).toString('base64url')`, then release the transaction before network calls. Select only rows whose status is not `sent`.

For each recipient, build escaped HTML with:

```js
const openUrl = `${base}/api/campaigns/open/${recipient.public_token}.gif`;
const clickUrl = campaign.cta_url
  ? `${base}/api/campaigns/click/${recipient.public_token}`
  : null;
const unsubscribeUrl = `${base}/unsubscribe/${recipient.public_token}`;
```

Update each recipient outcome independently, then aggregate database rows and set the campaign terminal state exactly as the spec defines. Extend `sendEmail` to preserve its existing contract and return provider IDs/errors for persistence.

- [ ] **Step 7: Verify service GREEN and full-suite compatibility**

Run: `node --test test/campaign-service.test.js && npm test`

Expected: campaign service tests pass and the existing campaign test is updated to opt in its fixture and expect truthful delivery status.

- [ ] **Step 8: Commit**

```bash
git add server/campaigns.js server/email.js test/campaign-service.test.js test/crm.test.js
git commit -m "feat: add idempotent campaign delivery service"
```

---

### Task 3: Public Tracking And Unsubscribe

**Files:**
- Create: `server/routes/campaigns-public.js`
- Modify: `server/app.js`
- Create: `test/campaign-public.test.js`

**Interfaces:**
- Consumes: `campaign_recipients.public_token` and campaign CTA from Tasks 1-2.
- Produces: public open, click, unsubscribe page, and unsubscribe API routes.

- [ ] **Step 1: Write failing public-route tests**

Cover first-open/first-click idempotence, stored-destination redirects, unknown-token neutrality, and multi-record unsubscribe:

```js
test('unsubscribe suppresses every matching record and is idempotent', async () => {
  const first = await req(`/api/campaigns/unsubscribe/${token}`, { method: 'POST' });
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { ok: true, message: 'You are unsubscribed from marketing emails.' });
  await req(`/api/campaigns/unsubscribe/${token}`, { method: 'POST' });
  const users = await pool.query('SELECT marketing_opt_in FROM users WHERE lower(email) = lower($1)', [email]);
  const contacts = await pool.query('SELECT marketing_opt_in FROM contacts WHERE lower(email) = lower($1)', [email]);
  assert.ok([...users.rows, ...contacts.rows].every((r) => r.marketing_opt_in === false));
});

test('click redirects only to the campaign CTA and counts once', async () => {
  const first = await req(`/api/campaigns/click/${token}?url=https://evil.example`, { redirect: 'manual' });
  assert.equal(first.status, 302);
  assert.equal(first.headers.get('location'), 'https://hbba.example/news');
  await req(`/api/campaigns/click/${token}`, { redirect: 'manual' });
  assert.equal(await clickCount(campaignId), 1);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/campaign-public.test.js`

Expected: FAIL with public routes returning 404.

- [ ] **Step 3: Implement and mount the public router**

Mount it after JSON/cookies/rate limiting but before authenticated routers. Return a fixed 1x1 transparent GIF buffer with `Cache-Control: no-store, private`. Use `COALESCE(first_opened_at, now())` and `COALESCE(first_clicked_at, now())` so repeated events do not alter first-event time. Render `/unsubscribe/:token` as escaped minimal HTML with a POST form. Unknown unsubscribe tokens return the same success text and status as known tokens.

- [ ] **Step 4: Verify GREEN and regression suite**

Run: `node --test test/campaign-public.test.js && npm test`

Expected: all public-route tests and the complete suite pass.

- [ ] **Step 5: Commit**

```bash
git add server/routes/campaigns-public.js server/app.js test/campaign-public.test.js
git commit -m "feat: add campaign tracking and unsubscribe"
```

---

### Task 4: Admin, Consent, And Scheduler APIs

**Files:**
- Modify: `server/routes/crm.js`
- Modify: `server/routes/data.js`
- Modify: `server/routes/ops.js`
- Modify: `vercel.json`
- Create: `test/campaign-api.test.js`

**Interfaces:**
- Consumes: service functions from Task 2 and public metrics from Task 3.
- Produces: consent-aware CRUD payloads, campaign creation/list/send/retry endpoints, and `GET /api/ops/campaigns/run`.

- [ ] **Step 1: Write failing consent API tests**

Assert contact creation and invited-user creation default false, explicit true stamps opt-in time, disabling stamps opt-out time, and list payloads expose the boolean:

```js
test('admin explicitly opts a contact into and out of marketing', async () => {
  const created = await adminReq('/api/admin/contacts', {
    method: 'POST', body: { name: 'Consent Test', email, marketing_opt_in: true }
  });
  assert.equal((await created.json()).contact.marketing_opt_in, true);
  const updated = await adminReq(`/api/admin/contacts/${contactId}`, {
    method: 'PATCH', body: { marketing_opt_in: false }
  });
  assert.equal((await updated.json()).contact.marketing_opt_in, false);
});
```

- [ ] **Step 2: Run consent API tests and verify RED**

Run: `node --test test/campaign-api.test.js --test-name-pattern="consent|marketing"`

Expected: FAIL because routes ignore or omit consent.

- [ ] **Step 3: Implement consent persistence in existing admin routes**

Accept only literal booleans. Use SQL `CASE` expressions so transitions stamp the matching timestamp and do not silently opt in records when the field is absent. Return `marketing_opt_in` in contact/user list and mutation payloads.

- [ ] **Step 4: Write failing campaign and scheduler API tests**

Test content persistence, malformed CTA rejection with no inserted row, eligible/total counts, manual send, retry, scheduler authentication, before-due skip, due claim, and the Review Focus race:

```js
test('concurrent cron runs claim a due campaign once', async () => {
  process.env.CRON_SECRET = 'cron-test-secret';
  const headers = { Authorization: 'Bearer cron-test-secret' };
  const [a, b] = await Promise.all([
    req('/api/ops/campaigns/run', { headers }),
    req('/api/ops/campaigns/run', { headers })
  ]);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.equal(await sentRecipientCount(campaignId), 1);
});
```

- [ ] **Step 5: Run API tests and verify RED**

Run: `node --test test/campaign-api.test.js --test-name-pattern="campaign|cron|CTA"`

Expected: FAIL because the new payloads and cron route are absent.

- [ ] **Step 6: Replace campaign route internals with the service**

Creation calls `validateCampaignInput` before `INSERT`. Listing joins aggregate recipient metrics and returns audiences as `{ segment, total, eligible }`. Manual send and retry both call `deliverCampaign`; return 409 for `Sending`/`Sent`, 400 for an empty eligible audience, and a truthful result object for terminal outcomes.

- [ ] **Step 7: Add the protected scheduler route and Vercel cron**

Validate `Authorization: Bearer ${CRON_SECRET}` with timing-safe comparison and return 404 when absent. Select at most five due campaigns and invoke `deliverCampaign` serially. Add:

```json
"crons": [
  { "path": "/api/ops/campaigns/run", "schedule": "*/5 * * * *" }
]
```

to `vercel.json` without changing existing functions, rewrites, or headers.

- [ ] **Step 8: Verify API GREEN and full suite**

Run: `node --test test/campaign-api.test.js && npm test`

Expected: campaign API tests and the complete suite pass.

- [ ] **Step 9: Commit**

```bash
git add server/routes/crm.js server/routes/data.js server/routes/ops.js vercel.json test/campaign-api.test.js
git commit -m "feat: expose consent and scheduled campaign APIs"
```

---

### Task 5: Campaign And Consent Admin UI

**Files:**
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Create: `test/campaign-interface.test.js`

**Interfaces:**
- Consumes: campaign/audience/contact/user response fields from Task 4.
- Produces: operable campaign authoring, scheduling, retry, reporting, and consent controls.

- [ ] **Step 1: Write failing interface contract tests**

Read frontend source and assert the required hooks/copy exist and obsolete claims are absent:

```js
test('campaign form captures content, CTA and consent-qualified audience', () => {
  assert.match(app, /data-cp="body_text"/);
  assert.match(app, /data-cp="cta_label"/);
  assert.match(app, /data-cp="cta_url"/);
  assert.match(app, /eligible/);
  assert.match(app, /Estimated open rate/);
  assert.match(app, /data-retry-campaign/);
  assert.doesNotMatch(app, /Scheduling records the campaign now; delivery runs once an email provider is connected/);
});

test('admin contact and invite forms expose explicit marketing consent', () => {
  assert.match(app, /data-field="marketing_opt_in"/);
  assert.match(app, /data-iu="marketing_opt_in"/);
});
```

- [ ] **Step 2: Run interface tests and verify RED**

Run: `node --test test/campaign-interface.test.js`

Expected: FAIL because the fields and retry controls are absent.

- [ ] **Step 3: Implement campaign authoring and reporting UI**

Add required message textarea, optional CTA pair, consent-aware audience labels (`eligible of total`), and future schedule input. Submit all fields through `createCampaign`. Display delivered, failed, estimated open rate, and unique clicks. Show:

- `Send now` for Draft/Scheduled.
- `Retry failed` for Failed/Partially sent.
- No action for Sending/Sent.

Use neutral/error toasts based on returned status; never show a success toast when `sent === 0`.

- [ ] **Step 4: Implement consent controls**

Add an unchecked `Marketing emails` checkbox to new-contact and invite-user forms and include its boolean in request bodies. Show consent status in contact detail and team rows, and add a consent checkbox to the existing contact edit flow using `PATCH /api/admin/contacts/:id`.

- [ ] **Step 5: Add responsive styles**

Keep the existing modal/card conventions. Give the campaign message textarea a stable minimum height, ensure campaign action buttons wrap below 480px, and keep table overflow inside its existing scroll container. Do not introduce nested cards or new decorative styling.

- [ ] **Step 6: Verify interface GREEN and full suite**

Run: `node --test test/campaign-interface.test.js && npm test`

Expected: interface contracts and all backend tests pass.

- [ ] **Step 7: Commit**

```bash
git add public/app.js public/styles.css test/campaign-interface.test.js
git commit -m "feat: complete campaign and consent admin UI"
```

---

### Task 6: End-To-End Release Verification And Documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/CODEBASE.md`
- Create: `test/campaign-browser.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: complete Tasks 1-5 flow.
- Produces: repeatable browser verification and deployment/operator instructions.

- [ ] **Step 1: Add Playwright as a development dependency and write the failing browser test**

Run: `npm install --save-dev @playwright/test`

Create a test that boots the existing app against the test database, logs in as admin, opts in a contact, creates a campaign with message and CTA, verifies Scheduled state, sends it in provider-disabled mode, verifies Failed with zero delivered, opens the outbox, and checks desktop/mobile overflow and browser errors.

```js
test('admin authors and observes a truthful campaign lifecycle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await loginAsAdmin(page);
  await page.getByRole('button', { name: 'Email Marketing' }).click();
  await page.getByRole('button', { name: 'New campaign' }).click();
  await page.locator('[data-cp="name"]').fill('Browser campaign');
  await page.locator('[data-cp="subject"]').fill('Campaign subject');
  await page.locator('[data-cp="body_text"]').fill('Campaign message body.');
  await page.getByRole('button', { name: 'Save campaign' }).click();
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run browser test and verify RED**

Run: `npx playwright test test/campaign-browser.test.js --project=chromium`

Expected: FAIL until browser setup helpers and final UI hooks are complete.

- [ ] **Step 3: Complete browser fixtures and verify GREEN**

Use unique `@example.test` records, explicit cleanup, and the real Express server on an ephemeral port. Test desktop `1440x900` and mobile `390x844`. Assert no horizontal document overflow, no failed API responses except the expected anonymous `/api/auth/me` 401 before login, and no console errors.

- [ ] **Step 4: Document configuration and operations**

Add these names to `.env.example` without values:

```dotenv
APP_URL=
RESEND_API_KEY=
EMAIL_FROM=
CRON_SECRET=
```

Document migration-before-cron ordering, explicit opt-in semantics, five-minute scheduling granularity, approximate open tracking, retry behavior, unsubscribe behavior, and a production smoke checklist. Remove documentation that says scheduling only records a campaign or that campaigns are merely demo outbox entries.

- [ ] **Step 5: Run all release gates**

Run:

```bash
npm run migrate
npm test
npx playwright test test/campaign-browser.test.js --project=chromium
git diff --check
```

Expected: migrations are up to date; all Node and browser tests pass; `git diff --check` prints nothing.

- [ ] **Step 6: Commit**

```bash
git add .env.example README.md docs/CODEBASE.md test/campaign-browser.test.js package.json package-lock.json
git commit -m "test: verify production campaign workflow"
```
