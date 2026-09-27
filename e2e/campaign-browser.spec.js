import { test, expect } from '@playwright/test';
import { createApp } from '../server/app.js';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

// The real Express app on an ephemeral port, against the test database. No
// provider credentials are set, so this exercises the honest failure path: a
// campaign that delivers nothing must say so rather than claim success.
const ADMIN = 'browser.admin@example.test';
const PASSWORD = 'browser-admin-password';
const CONTACT = 'browser.contact@example.test';
const STAMP = Date.now();
const CAMPAIGN = `Browser campaign ${STAMP}`;

let server;
let base;

async function wipe() {
  await query("DELETE FROM campaign_recipients WHERE lower(email) LIKE '%@example.test'");
  await query("DELETE FROM campaigns WHERE name LIKE 'Browser campaign%'");
  await query("DELETE FROM contacts WHERE lower(email) LIKE '%@example.test'");
  await query("DELETE FROM users WHERE lower(email) LIKE '%@example.test'");
}

test.beforeAll(async () => {
  await wipe();
  const hash = await hashPassword(PASSWORD);
  await query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ($1, $2, 'admin', 'Browser Admin', 'active')`, [ADMIN, hash]);
  // An opted-in member so the campaign has a real, consent-qualified audience.
  await query(
    `INSERT INTO users (email, password_hash, role, full_name, status, marketing_opt_in, marketing_opted_in_at)
     VALUES ('browser.member@example.test', $1, 'member', 'Browser Member', 'active', true, now())`, [hash]);

  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  await wipe();
  await new Promise((r) => server.close(r));
  await closePool();
});

async function loginAsAdmin(page) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#loginForm input[type="email"]').fill(ADMIN);
  await page.locator('#loginForm input[type="password"]').fill(PASSWORD);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.waitForFunction(() => document.getElementById('pageRoot')?.innerText.trim().length > 20, null, { timeout: 25_000 });
}

/** Console errors and failed API calls, minus the expected pre-login 401. */
function watch(page) {
  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('401')) problems.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().includes('/api/auth/me')) {
      problems.push(`${response.status()} ${response.url()}`);
    }
  });
  return problems;
}

test('admin authors and observes a truthful campaign lifecycle', async ({ page }) => {
  const problems = watch(page);
  await loginAsAdmin(page);

  // Consent first: a contact created without the box ticked must stay opted out.
  await page.locator('#sidebarNav [data-page="crm"]').click();
  await page.locator('[data-modal="new-contact"]').first().click();
  await page.locator('[data-ct="name"]').fill('Browser Contact');
  await page.locator('[data-ct="email"]').fill(CONTACT);
  await expect(page.locator('[data-field="marketing_opt_in"]')).not.toBeChecked();
  await page.locator('[data-field="marketing_opt_in"]').check();
  await page.locator('[data-create-contact]').click();
  await expect(page.locator('#toastStack .toast').last()).toContainText('added to the CRM');

  const { rows } = await query('SELECT marketing_opt_in FROM contacts WHERE email = $1', [CONTACT]);
  expect(rows[0].marketing_opt_in).toBe(true);

  // Author a campaign with a message and a call to action.
  await page.locator('#sidebarNav [data-page="email"]').click();
  await page.locator('[data-modal="new-campaign"]').first().click();
  await page.locator('[data-cp="name"]').fill(CAMPAIGN);
  await page.locator('[data-cp="subject"]').fill('Campaign subject');
  await page.locator('[data-cp="body_text"]').fill('Campaign message body.');
  await page.locator('[data-cp="cta_label"]').fill('Read the update');
  await page.locator('[data-cp="cta_url"]').fill('https://hbba.example/news');
  await page.locator('[data-create-campaign]').click();
  await expect(page.locator('#toastStack .toast').last()).toContainText('draft');

  const row = page.locator('tr', { hasText: CAMPAIGN });
  await expect(row).toContainText('Draft');

  // The toast stack overlays the action column while it is on screen.
  await expect(page.locator('#toastStack .toast')).toHaveCount(0, { timeout: 15_000 });

  // Sending with no provider connected must report failure, not success.
  await row.locator('[data-send-campaign]').click();
  await expect(page.locator('#toastStack .toast').last()).toContainText('Nothing delivered', { timeout: 20_000 });
  await expect(page.locator('tr', { hasText: CAMPAIGN })).toContainText('Failed');

  const campaign = await query('SELECT status, sent_count FROM campaigns WHERE name = $1', [CAMPAIGN]);
  expect(campaign.rows[0].status).toBe('Failed');
  expect(campaign.rows[0].sent_count).toBe(0);

  // The failure is retryable, and the attempt is visible in the outbox.
  await expect(page.locator('tr', { hasText: CAMPAIGN }).locator('[data-retry-campaign]')).toBeVisible();
  await expect(page.locator('#pageRoot')).toContainText(/outbox/i);
  await expect(page.locator('#pageRoot')).toContainText(/estimated/i);

  expect(problems).toEqual([]);
});

test('the campaign page fits desktop and phone without horizontal overflow', async ({ page }) => {
  const problems = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsAdmin(page);

  // One session, two viewports: signing in again would find the form hidden.
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.evaluate(() => render('email'));
    await page.waitForTimeout(700);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `no horizontal overflow at ${size.width}px`).toBeLessThanOrEqual(1);

    // The authoring form has to stay usable at this width too.
    await page.locator('[data-modal="new-campaign"]').first().click();
    await expect(page.locator('[data-cp="body_text"]')).toBeVisible();
    const box = await page.locator('[data-cp="body_text"]').boundingBox();
    expect(box.height, `the message box keeps a workable height at ${size.width}px`).toBeGreaterThan(80);

    const modalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(modalOverflow, `the modal does not push the page sideways at ${size.width}px`).toBeLessThanOrEqual(1);

    await page.locator('[data-modal-close]').first().click();
    await page.waitForTimeout(300);
  }

  expect(problems).toEqual([]);
});

test('unsubscribe works from the link in a campaign email', async ({ page }) => {
  const problems = watch(page);

  // A delivered recipient, as the delivery service would have written it.
  const { rows: campaign } = await query(
    `INSERT INTO campaigns (name, subject, body_text, segment, status)
     VALUES ($1, 'Subject', 'Body', 'Contacts', 'Sent') RETURNING id`, [`Browser campaign unsub ${STAMP}`]);
  const token = `browser-unsub-token-${STAMP}`;
  await query(
    `INSERT INTO campaign_recipients (campaign_id, email, display_name, public_token, delivery_status, sent_at)
     VALUES ($1, $2, 'Browser Contact', $3, 'sent', now())`, [campaign[0].id, CONTACT, token]);
  await query(
    `INSERT INTO contacts (name, email, marketing_opt_in, marketing_opted_in_at)
     VALUES ('Browser Contact', $1, true, now())
     ON CONFLICT (email) DO UPDATE SET marketing_opt_in = true, marketing_opted_in_at = now()`, [CONTACT]);

  await page.goto(`${base}/unsubscribe/${token}`, { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText('Unsubscribe');
  await expect(page.locator('body')).not.toContainText(CONTACT, { timeout: 2000 });

  await page.getByRole('button', { name: 'Unsubscribe me' }).click();
  await expect(page.locator('#done')).toBeVisible();

  const { rows } = await query('SELECT marketing_opt_in FROM contacts WHERE email = $1', [CONTACT]);
  expect(rows[0].marketing_opt_in).toBe(false);

  expect(problems).toEqual([]);
});
