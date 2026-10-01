import { test, expect } from '@playwright/test';
import { createApp } from '../server/app.js';
import { query } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

// The real app in a real browser: compose an invoice, watch the figures track
// what is typed, share it, open that link as somebody with no account at all,
// accept it, and edit a profile picture. Buttons that look like they work but
// do not are exactly what this is for.
const ADMIN = 'inv.browser.admin@example.test';
const MEMBER = 'inv.browser.member@example.test';
const PASSWORD = 'browser-invoice-password';
const CLIENT = `Browser Client ${Date.now()}`;

let server;
let base;

async function wipe() {
  await query(`DELETE FROM invoices WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Browser Client%')
               OR user_id IN (SELECT id FROM users WHERE lower(email) LIKE '%.browser.%@example.test')`);
  await query("DELETE FROM clients WHERE name LIKE 'Browser Client%'");
  await query("DELETE FROM bank_accounts WHERE label = 'Browser test account'");
  await query("DELETE FROM users WHERE lower(email) LIKE '%.browser.%@example.test'");
}

test.beforeAll(async () => {
  await wipe();
  const hash = await hashPassword(PASSWORD);
  await query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ($1, $2, 'admin', 'Browser Invoice Admin', 'active'), ($3, $2, 'member', 'Browser Invoice Member', 'active')`,
    [ADMIN, hash, MEMBER]);
  await query(
    `INSERT INTO bank_accounts (label, account_name, bank_name, sort_code, account_number, is_default)
     VALUES ('Browser test account', 'HBBA Global Ltd', 'Test Bank', '00-00-00', '12345678', false)`);
  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  await wipe();
  await new Promise((r) => server.close(r));
});

async function login(page, email) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#loginForm input[type="email"]').fill(email);
  await page.locator('#loginForm input[type="password"]').fill(PASSWORD);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.waitForFunction(() => document.getElementById('pageRoot')?.innerText.trim().length > 20, null, { timeout: 25_000 });
}

/** Console errors and page crashes, minus the expected pre-login 401. */
function watch(page) {
  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('401')) problems.push(`console: ${message.text()}`);
  });
  return problems;
}

test('the header shows the person signed in, not a stock photograph', async ({ page }) => {
  const problems = watch(page);
  await login(page, MEMBER);

  await expect(page.locator('#profileToggle strong')).toHaveText('Browser Invoice Member');
  // Nobody has uploaded a picture, so initials stand in for one.
  await expect(page.locator('#profilePic .avatar-initials')).toHaveText('BI');
  const stock = await page.locator('#profileToggle img[src*="unsplash"]').count();
  expect(stock).toBe(0);
  expect(problems).toEqual([]);
});

test('a person can change their own name and picture', async ({ page }) => {
  const problems = watch(page);
  await login(page, MEMBER);

  await page.locator('.nav-item', { hasText: 'My Profile' }).click();
  await expect(page.locator('[data-pf="full_name"]')).toBeVisible();

  await page.locator('[data-pf="full_name"]').fill('Jane Cole');
  await page.locator('[data-pf="job_title"]').fill('Managing Director');
  await page.locator('[data-pf="city"]').fill('Birmingham');
  await page.locator('[data-save-profile]').click();
  await expect(page.locator('.toast', { hasText: 'Profile saved' })).toBeVisible();

  // The header follows, because it renders the person and not the role.
  await expect(page.locator('#profileToggle strong')).toHaveText('Jane Cole');
  await expect(page.locator('#profileToggle small')).toHaveText('Managing Director');

  // A real PNG through the file input, resized in the browser on the way up.
  await page.locator('#avatarFile').setInputFiles({
    name: 'me.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64')
  });
  await expect(page.locator('#profilePic img')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#profilePic img')).toHaveAttribute('src', /^data:image\//);

  const { rows } = await query('SELECT full_name, job_title, city, avatar_data FROM users WHERE email = $1', [MEMBER]);
  expect(rows[0].full_name).toBe('Jane Cole');
  expect(rows[0].job_title).toBe('Managing Director');
  expect(rows[0].city).toBe('Birmingham');
  expect(rows[0].avatar_data).toMatch(/^data:image\//);
  expect(problems).toEqual([]);
});

// The next three share one invoice: it is composed, then shared, then revoked.
test.describe.configure({ mode: 'serial' });

test('the builder tracks what is typed, and the invoice it saves matches', async ({ page }) => {
  const problems = watch(page);
  await login(page, ADMIN);

  // A client first: an invoice should be addressed to a company, not a guess.
  await page.locator('.nav-item', { hasText: 'Clients' }).click();
  await page.locator('[data-new-client]').click();
  await page.locator('[data-cl="name"]').fill(CLIENT);
  await page.locator('[data-cl="email"]').fill('accounts@browser-client.test');
  await page.locator('[data-cl="city"]').fill('Coventry');
  await page.locator('[data-cl="vat_no"]').fill('GB999888777');
  await page.locator('[data-save-client]').click();
  await expect(page.locator('table.table')).toContainText(CLIENT);

  await page.locator('.nav-item', { hasText: 'Invoices & Payments' }).click();
  await page.locator('[data-new-invoice]').click();
  await expect(page.locator('#invoiceBuilder')).toBeVisible();

  await page.locator('[data-inv="document_title"]').fill('Tax Invoice');
  await page.locator('[data-inv="po_ref"]').fill('PO-BROWSER-1');
  const { rows: clientRow } = await query('SELECT id FROM clients WHERE name = $1', [CLIENT]);
  await page.locator('[data-inv="client_id"]').selectOption(clientRow[0].id);
  await page.locator('[data-inv="due_on"]').fill('2026-07-15');

  await page.locator('[data-item="description"][data-index="0"]').fill('Consultancy');
  await page.locator('[data-item="unit"][data-index="0"]').selectOption('Hour');
  await page.locator('[data-item="qty"][data-index="0"]').fill('10');
  await page.locator('[data-item="rate"][data-index="0"]').fill('100');

  // 10 × £100 = £1,000, then 20% VAT.
  await expect(page.locator('#invPreview')).toContainText('£1,000.00');
  await expect(page.locator('#invPreview')).toContainText('£1,200.00');
  await expect(page.locator('#invPreview')).toContainText(CLIENT);
  await expect(page.locator('#invPreview')).toContainText('TAX INVOICE');

  // A 10% discount must move VAT too, or the tax is being charged on money
  // the client is not being asked for.
  await page.locator('[data-inv="discount_value"]').fill('10');
  await expect(page.locator('#invPreview')).toContainText('£1,080.00');

  // A second line, and the figures follow.
  await page.locator('[data-add-line]').click();
  await page.locator('[data-item="description"][data-index="1"]').fill('Travel');
  await page.locator('[data-item="rate"][data-index="1"]').fill('50');
  await expect(page.locator('#invPreview')).toContainText('£1,134.00');

  await page.locator('[data-save-invoice]').click();
  await expect(page.locator('.toast', { hasText: 'created' })).toBeVisible();
  await expect(page.locator('table.table')).toContainText('Tax Invoice');

  const { rows } = await query(
    `SELECT number, amount_cents, subtotal_cents, discount_cents, tax_cents, due_on, document_title, po_ref
       FROM invoices WHERE client_id = (SELECT id FROM clients WHERE name = $1)`, [CLIENT]);
  expect(rows).toHaveLength(1);
  expect(rows[0].subtotal_cents).toBe(105000);
  expect(rows[0].discount_cents).toBe(10500);
  expect(rows[0].tax_cents).toBe(18900);
  expect(rows[0].amount_cents).toBe(113400);
  expect(rows[0].document_title).toBe('Tax Invoice');
  expect(rows[0].po_ref).toBe('PO-BROWSER-1');
  expect(problems).toEqual([]);
});

test('a client with no account opens the shared link, reads it and accepts it', async ({ page, browser }) => {
  const problems = watch(page);
  await login(page, ADMIN);

  const { rows } = await query(
    `SELECT number FROM invoices WHERE client_id = (SELECT id FROM clients WHERE name = $1)`, [CLIENT]);
  const number = rows[0].number;

  await page.locator('.nav-item', { hasText: 'Invoices & Payments' }).click();
  await page.locator(`[data-share-invoice="${number}"]`).click();
  const link = await page.locator('#shareLink').inputValue();
  expect(link).toContain('/invoice.html#');

  // A brand-new context: no cookie, no account, nothing but the link.
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  const guestProblems = watch(guestPage);
  await guestPage.goto(link.replace(/^https?:\/\/[^/]+/, base), { waitUntil: 'networkidle' });

  await expect(guestPage.locator('.sheet-head h1')).toHaveText('TAX INVOICE');
  await expect(guestPage.locator('.sheet')).toContainText(CLIENT);
  await expect(guestPage.locator('.sheet')).toContainText('GB999888777');
  await expect(guestPage.locator('.sums .grand')).toContainText('£1,134.00');
  await expect(guestPage.locator('.sheet')).toContainText('2026-07-15');
  // The bank details are how an invoice actually gets paid.
  await expect(guestPage.locator('.sheet')).toContainText('00-00-00');

  await guestPage.locator('#sig').fill('Jane Smith');
  await guestPage.locator('#signBtn').click();
  await expect(guestPage.locator('.msg.ok')).toContainText('acceptance has been recorded');
  await expect(guestPage.locator('.sheet')).toContainText('Accepted by');

  const { rows: signed } = await query('SELECT signed_name, signed_at FROM invoices WHERE number = $1', [number]);
  expect(signed[0].signed_name).toBe('Jane Smith');
  expect(signed[0].signed_at).toBeTruthy();

  expect(guestProblems).toEqual([]);
  expect(problems).toEqual([]);
  await guest.close();
});

test('a revoked link stops working for the person holding it', async ({ page, browser }) => {
  await login(page, ADMIN);
  const { rows } = await query(
    `SELECT number FROM invoices WHERE client_id = (SELECT id FROM clients WHERE name = $1)`, [CLIENT]);
  const number = rows[0].number;

  await page.locator('.nav-item', { hasText: 'Invoices & Payments' }).click();
  await page.locator(`[data-share-invoice="${number}"]`).click();
  const original = await page.locator('#shareLink').inputValue();

  await page.locator(`[data-rotate-share="${number}"]`).click();
  await expect(page.locator('#shareLink')).not.toHaveValue(original);

  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto(original.replace(/^https?:\/\/[^/]+/, base), { waitUntil: 'networkidle' });
  await expect(guestPage.locator('.centred')).toContainText('no longer valid');
  await guest.close();
});

test('reopening an invoice in the builder keeps everything it had', async ({ page }) => {
  const problems = watch(page);
  await login(page, ADMIN);

  const { rows } = await query(
    `SELECT number FROM invoices WHERE client_id = (SELECT id FROM clients WHERE name = $1)`, [CLIENT]);
  const number = rows[0].number;

  await page.locator('.nav-item', { hasText: 'Invoices & Payments' }).click();
  await page.locator(`[data-edit-invoice="${number}"]`).click();
  await expect(page.locator('#invoiceBuilder')).toBeVisible();

  // Everything the document held comes back into the form, not just its text.
  await expect(page.locator('[data-inv="document_title"]')).toHaveValue('Tax Invoice');
  await expect(page.locator('[data-inv="po_ref"]')).toHaveValue('PO-BROWSER-1');
  await expect(page.locator('[data-inv="due_on"]')).toHaveValue('2026-07-15');
  await expect(page.locator('[data-inv="discount_value"]')).toHaveValue('10');
  await expect(page.locator('[data-item="description"][data-index="0"]')).toHaveValue('Consultancy');
  await expect(page.locator('[data-item="unit"][data-index="0"]')).toHaveValue('Hour');
  await expect(page.locator('[data-item="qty"][data-index="0"]')).toHaveValue('10');
  await expect(page.locator('#invPreview')).toContainText(CLIENT);
  await expect(page.locator('#invPreview')).toContainText('£1,134.00');

  // One change, saved; nothing else should move.
  await page.locator('[data-item="qty"][data-index="0"]').fill('12');
  await expect(page.locator('#invPreview')).toContainText('£1,350.00');
  await page.locator('[data-save-invoice]').click();
  await expect(page.locator('.toast', { hasText: 'updated' })).toBeVisible();

  const { rows: after } = await query(
    `SELECT i.amount_cents, i.discount_cents, i.po_ref, i.bank_account_id, c.name AS client
       FROM invoices i LEFT JOIN clients c ON c.id = i.client_id WHERE i.number = $1`, [number]);
  expect(after[0].amount_cents).toBe(135000);
  expect(after[0].discount_cents).toBe(12500);
  expect(after[0].po_ref).toBe('PO-BROWSER-1');
  expect(after[0].client).toBe(CLIENT);
  expect(after[0].bank_account_id).toBeTruthy();
  expect(problems).toEqual([]);
});

test('a member granted invoicing gets the pages, and nothing else', async ({ page }) => {
  const problems = watch(page);
  await query(`UPDATE users SET permissions = '["invoices.manage"]'::jsonb WHERE email = $1`, [MEMBER]);
  await login(page, MEMBER);

  await expect(page.locator('.nav-item', { hasText: 'Invoices & Payments' })).toBeVisible();
  await expect(page.locator('.nav-item', { hasText: 'Clients' })).toBeVisible();
  // Not granted, so not offered.
  await expect(page.locator('.nav-item', { hasText: 'Email Marketing' })).toHaveCount(0);
  await expect(page.locator('.nav-item', { hasText: 'Settings' })).toHaveCount(0);

  await page.locator('.nav-item', { hasText: 'Invoices & Payments' }).click();
  await page.locator('[data-new-invoice]').click();
  await expect(page.locator('#invoiceBuilder')).toBeVisible();

  await query(`UPDATE users SET permissions = '[]'::jsonb WHERE email = $1`, [MEMBER]);
  expect(problems).toEqual([]);
});

test('a split invoice can be settled a part at a time', async ({ page }) => {
  const problems = watch(page);
  await login(page, ADMIN);

  const { rows: client } = await query('SELECT id FROM clients WHERE name = $1', [CLIENT]);
  await page.locator('.nav-item', { hasText: 'Invoices & Payments' }).click();
  await page.locator('[data-new-invoice]').click();
  await page.locator('[data-inv="client_id"]').selectOption(client[0].id);
  await page.locator('[data-inv="document_title"]').fill('Split Invoice');
  await page.locator('[data-inv="vat_rate"]').fill('0');
  await page.locator('[data-item="description"][data-index="0"]').fill('Sponsorship');
  await page.locator('[data-item="rate"][data-index="0"]').fill('900');
  await page.locator('[data-inv-check="split_installments"]').check();
  await page.locator('[data-inv="installment_count"]').fill('3');
  await expect(page.locator('#invPreview')).toContainText('Split into 3 parts');
  await page.locator('[data-save-invoice]').click();
  await expect(page.locator('.toast', { hasText: 'created' })).toBeVisible();

  const { rows } = await query(`SELECT number FROM invoices WHERE document_title = 'Split Invoice'`);
  const number = rows[0].number;

  // The whole row opens the document; its first cell holds no buttons.
  await page.locator(`tr[data-view-invoice="${number}"] td`).first().click();
  await expect(page.locator('.invoice-doc')).toContainText('Payment schedule');
  await expect(page.locator('.invoice-doc')).toContainText('Installment 1 of 3');

  await page.locator('[data-settle-installment]').first().click();
  await expect(page.locator('.toast', { hasText: '2 part(s) still open' })).toBeVisible();

  const { rows: parts } = await query(
    `SELECT status FROM invoice_installments
      WHERE invoice_id = (SELECT id FROM invoices WHERE number = $1) ORDER BY sort`, [number]);
  expect(parts.map((p) => p.status)).toEqual(['paid', 'due', 'due']);
  expect(problems).toEqual([]);
});

test('a client can be edited and removed again', async ({ page }) => {
  const problems = watch(page);
  await login(page, ADMIN);

  await page.locator('.nav-item', { hasText: 'Clients' }).click();
  await page.locator('[data-new-client]').click();
  await page.locator('[data-cl="name"]').fill('Browser Client Temporary');
  await page.locator('[data-save-client]').click();
  await expect(page.locator('table.table')).toContainText('Browser Client Temporary');

  const { rows } = await query('SELECT id FROM clients WHERE name = $1', ['Browser Client Temporary']);
  await page.locator(`[data-edit-client="${rows[0].id}"]`).click();
  await page.locator('[data-cl="city"]').fill('Solihull');
  await page.locator('[data-save-client]').click();
  await expect(page.locator('.toast', { hasText: 'Client updated' })).toBeVisible();
  await expect(page.locator(`tr:has-text("Browser Client Temporary")`)).toContainText('Solihull');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator(`[data-delete-client="${rows[0].id}"]`).click();
  await expect(page.locator('.toast', { hasText: 'Client removed' })).toBeVisible();
  // Assert against the page, not the table: with no clients left there is an
  // empty state and no table at all.
  await expect(page.locator('#pageRoot')).not.toContainText('Browser Client Temporary');

  // The client with invoices against it must survive the same attempt.
  const { rows: billed } = await query('SELECT id FROM clients WHERE name = $1', [CLIENT]);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator(`[data-delete-client="${billed[0].id}"]`).click();
  await expect(page.locator('.toast', { hasText: 'invoice(s)' })).toBeVisible();

  // The 409 above is the refusal this test asked for; anything else is not.
  expect(problems.filter((p) => !p.includes('409'))).toEqual([]);
});
