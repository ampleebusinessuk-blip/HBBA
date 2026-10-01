// The invoicing surface end to end: billing a company that has no account,
// the document that gets printed, the link a client opens without signing in,
// acceptance, payment, repeats and splits.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, query, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';
import { runRecurringInvoices } from '../server/routes/invoices.js';

let server;
let base;
let adminCookie;
let memberCookie;
let clientId;
let bankId;

const ADMIN = 'inv.admin@inv.test';
const MEMBER = 'inv.member@inv.test';

async function req(path, { method = 'GET', body, cookie } = {}) {
  return fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
}
const adminReq = (path, o = {}) => req(path, { ...o, cookie: adminCookie });
const memberReq = (path, o = {}) => req(path, { ...o, cookie: memberCookie });
const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];

/** One line, one rate — enough to exercise the document without noise. */
const simpleInvoice = (overrides = {}) => ({
  client_id: clientId,
  items: [{ description: 'Annual membership', unit: 'Service', qty: 1, rate: '500.00' }],
  vat_rate: 20,
  due_on: '2026-12-31',
  ...overrides
});

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  const hash = await hashPassword('password123');
  for (const [email, role] of [[ADMIN, 'admin'], [MEMBER, 'member']]) {
    await query(
      `INSERT INTO users (email, password_hash, role, full_name, status) VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [email, hash, role, `Inv ${role}`]);
  }

  await new Promise((r) => { server = createApp().listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}`;
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: ADMIN, password: 'password123' } }));
  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: MEMBER, password: 'password123' } }));

  const bank = await adminReq('/api/admin/bank-accounts', {
    method: 'POST',
    body: { label: 'Inv test account', account_name: 'HBBA Global Ltd', bank_name: 'Test Bank', sort_code: '00-00-00', account_number: '12345678' }
  });
  bankId = (await bank.json()).account?.id;
});

after(async () => {
  await query(`DELETE FROM invoices WHERE number LIKE 'INV-%' AND (client_id IN (SELECT id FROM clients WHERE name LIKE 'Inv Test%') OR user_id IN (SELECT id FROM users WHERE email LIKE '%@inv.test'))`);
  await query("DELETE FROM clients WHERE name LIKE 'Inv Test%'");
  await query("DELETE FROM bank_accounts WHERE label = 'Inv test account'");
  await query("DELETE FROM users WHERE email LIKE '%@inv.test'");
  await new Promise((r) => server.close(r));
  await closePool();
});

/* ===================== CLIENTS ===================== */

test('a company with no portal account can still be billed', async () => {
  const res = await adminReq('/api/admin/clients', {
    method: 'POST',
    body: {
      name: 'Inv Test Acme Ltd', contact_name: 'Jane Smith', email: 'accounts@inv-acme.test',
      address: '12 High Street', city: 'Birmingham', postcode: 'B1 1AA', vat_no: 'GB123456789'
    }
  });
  assert.equal(res.status, 201);
  const { client } = await res.json();
  clientId = client.id;
  assert.equal(client.name, 'Inv Test Acme Ltd');
  // Nobody signed up with that address, so nothing was linked.
  assert.equal(client.user_id, null);
  assert.equal(client.invoices, 0);
});

test('a client is linked to a portal account only by an exact email match', async () => {
  const res = await adminReq('/api/admin/clients', { method: 'POST', body: { name: 'Inv Test Linked', email: MEMBER.toUpperCase() } });
  const { client } = await res.json();
  assert.ok(client.user_id, 'the matching account should have been linked');
  await adminReq(`/api/admin/clients/${client.id}`, { method: 'DELETE' });
});

test('a bad client email is refused rather than stored', async () => {
  const res = await adminReq('/api/admin/clients', { method: 'POST', body: { name: 'Inv Test Bad', email: 'not-an-email' } });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /not valid/i);
});

test('a member cannot read or write the client list', async () => {
  assert.equal((await memberReq('/api/admin/clients')).status, 403);
  assert.equal((await memberReq('/api/admin/clients', { method: 'POST', body: { name: 'Nope' } })).status, 403);
});

/* ===================== THE DOCUMENT ===================== */

test('an invoice prints who is billing, who is billed, and where to pay', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST',
    body: simpleInvoice({
      document_title: 'Tax Invoice', po_ref: 'PO-9981', service_category: 'Membership',
      location_mode: 'Remote', delivery_period: '2026', bank_account_id: bankId,
      header_color: '#0f9f6e', notes: 'Thank you.'
    })
  });
  assert.equal(created.status, 201);
  const { number } = await created.json();

  const res = await adminReq(`/api/admin/invoices/${number}/document`);
  assert.equal(res.status, 200);
  const { document } = await res.json();

  assert.equal(document.documentTitle, 'Tax Invoice');
  assert.equal(document.headerColor, '#0f9f6e');
  assert.equal(document.poRef, 'PO-9981');
  assert.equal(document.billedTo.name, 'Inv Test Acme Ltd');
  assert.equal(document.billedTo.vatNo, 'GB123456789');
  assert.match(document.billedTo.address, /Birmingham/);
  assert.ok(document.billedBy.name, 'the business billing should be named');
  assert.equal(document.bank.accountName, 'HBBA Global Ltd');
  assert.equal(document.bank.sortCode, '00-00-00');
  assert.equal(document.items[0].unit, 'Service');
  assert.equal(document.totals.subtotal, '£500.00');
  assert.equal(document.totals.tax, '£100.00');
  assert.equal(document.totals.due, '£600.00');
  assert.equal(document.due, '2026-12-31');
});

test('the due date survives the round trip through the database', async () => {
  // A date read back through UTC loses a day wherever the offset is positive,
  // which is every British summer.
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice({ due_on: '2026-07-15' }) });
  const { number } = await created.json();
  const { document } = await (await adminReq(`/api/admin/invoices/${number}/document`)).json();
  assert.equal(document.due, '2026-07-15');
});

test('a discount is taken off before VAT is worked out', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST',
    body: simpleInvoice({ discount_type: 'percent', discount_value: 10, advance_paid: '50.00' })
  });
  const { totals } = await created.json();
  assert.equal(totals.subtotal_cents, 50000);
  assert.equal(totals.discount_cents, 5000);
  assert.equal(totals.tax_cents, 9000);
  assert.equal(totals.gross_cents, 54000);
  assert.equal(totals.due_cents, 49000);
});

test('an invoice with no line worth billing is refused', async () => {
  const res = await adminReq('/api/admin/invoices', { method: 'POST', body: { items: [{ description: '', rate: '10' }] } });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /at least one line item/i);
});

test('the builder is told which clients, accounts and units it may offer', async () => {
  const res = await adminReq('/api/admin/invoices/options');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.clients.some((c) => c.id === clientId));
  assert.ok(data.bankAccounts.some((b) => b.id === bankId));
  assert.ok(data.units.includes('Hour'));
  assert.ok(data.business.name);
});

test('re-lining an invoice recomputes every figure', async () => {
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice() });
  const { number } = await created.json();

  const res = await adminReq(`/api/admin/invoices/${number}`, {
    method: 'PATCH',
    body: { items: [{ description: 'Revised', unit: 'Hour', qty: 4, rate: '100.00' }], vat_rate: 0 }
  });
  assert.equal(res.status, 200);
  const { document } = await (await adminReq(`/api/admin/invoices/${number}/document`)).json();
  assert.equal(document.items.length, 1);
  assert.equal(document.items[0].unit, 'Hour');
  assert.equal(document.totals.subtotal, '£400.00');
  assert.equal(document.totals.due, '£400.00');
});

test('a paid invoice cannot be quietly re-lined', async () => {
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice({ status: 'paid' }) });
  const { number } = await created.json();
  const res = await adminReq(`/api/admin/invoices/${number}`, {
    method: 'PATCH', body: { items: [{ description: 'Sneaky', rate: '1.00' }] }
  });
  assert.equal(res.status, 409);
  assert.match((await res.json()).error, /void it and raise a new one/i);
});

/* ===================== THE PUBLIC LINK ===================== */

test('a client opens an invoice with the token alone, and sees only that invoice', async () => {
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice({ bank_account_id: bankId }) });
  const { number } = await created.json();
  const share = await adminReq(`/api/admin/invoices/${number}/share`, { method: 'POST' });
  const { url, token } = await share.json();
  assert.match(url, /\/invoice\.html#/);

  // No cookie at all: this is somebody who has never had an account.
  const res = await req(`/api/public/invoices/${token}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.document.number, number);
  assert.equal(data.actions.sign, true);
  // Card payment is off unless it was switched on for this invoice.
  assert.equal(data.actions.pay, false);
});

test('a wrong or short token reveals nothing', async () => {
  assert.equal((await req('/api/public/invoices/short')).status, 404);
  assert.equal((await req(`/api/public/invoices/${'x'.repeat(32)}`)).status, 404);
});

test('rotating a link revokes the old one', async () => {
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice() });
  const { number } = await created.json();
  const first = await (await adminReq(`/api/admin/invoices/${number}/share`, { method: 'POST' })).json();
  const second = await (await adminReq(`/api/admin/invoices/${number}/share`, { method: 'POST', body: { rotate: true } })).json();

  assert.notEqual(first.token, second.token);
  assert.equal((await req(`/api/public/invoices/${first.token}`)).status, 404);
  assert.equal((await req(`/api/public/invoices/${second.token}`)).status, 200);
});

test('a voided invoice stops opening', async () => {
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice() });
  const { number, public_token: token } = await created.json();
  assert.equal((await req(`/api/public/invoices/${token}`)).status, 200);
  await adminReq(`/api/admin/invoices/${number}`, { method: 'DELETE' });
  assert.equal((await req(`/api/public/invoices/${token}`)).status, 404);
});

test('acceptance is recorded once, with the name, the time and the address', async () => {
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice() });
  const { number, public_token: token } = await created.json();

  assert.equal((await req(`/api/public/invoices/${token}/sign`, { method: 'POST', body: { name: 'J' } })).status, 400);

  const signed = await req(`/api/public/invoices/${token}/sign`, { method: 'POST', body: { name: 'Jane Smith' } });
  assert.equal(signed.status, 200);

  // A signature that could be overwritten would be worth nothing.
  const again = await req(`/api/public/invoices/${token}/sign`, { method: 'POST', body: { name: 'Somebody Else' } });
  assert.equal(again.status, 409);

  const { document } = await (await adminReq(`/api/admin/invoices/${number}/document`)).json();
  assert.equal(document.signature.name, 'Jane Smith');
  assert.ok(document.signature.at);

  const { rows } = await query('SELECT signed_ip FROM invoices WHERE number = $1', [number]);
  assert.ok(rows[0].signed_ip, 'the address it came from should be kept');
});

test('card payment on the public link is refused unless it was switched on', async () => {
  const off = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice() });
  const offToken = (await off.json()).public_token;
  assert.equal((await req(`/api/public/invoices/${offToken}/pay`, { method: 'POST' })).status, 403);

  const on = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice({ allow_card_payment: true }) });
  const { number, public_token: onToken } = await on.json();

  // Stripe is not connected in the test environment, so this is the demo path.
  const started = await req(`/api/public/invoices/${onToken}/pay`, { method: 'POST' });
  assert.equal(started.status, 200);
  const offer = await started.json();
  assert.equal(offer.demo, true);
  assert.match(offer.message, /no card is charged/i);

  const settled = await req(`/api/public/invoices/${onToken}/pay/demo`, { method: 'POST' });
  assert.equal(settled.status, 200);
  assert.equal((await settled.json()).demo, true);

  // And it settles exactly once.
  assert.equal((await req(`/api/public/invoices/${onToken}/pay/demo`, { method: 'POST' })).status, 400);
  const { rows } = await query('SELECT status, payment_ref FROM invoices WHERE number = $1', [number]);
  assert.equal(rows[0].status, 'paid');
  assert.match(rows[0].payment_ref, /^demo-/);
});

/* ===================== REPEATS AND SPLITS ===================== */

test('a split invoice gets a schedule that adds back to the balance', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST',
    body: simpleInvoice({ split_installments: true, installment_count: 3, vat_rate: 0 })
  });
  const { number } = await created.json();
  const { document } = await (await adminReq(`/api/admin/invoices/${number}/document`)).json();

  assert.equal(document.installments.length, 3);
  assert.equal(document.installments[0].label, 'Installment 1 of 3');
  const { rows } = await query(
    `SELECT sum(amount_cents)::int AS total FROM invoice_installments
      WHERE invoice_id = (SELECT id FROM invoices WHERE number = $1)`, [number]);
  assert.equal(rows[0].total, 50000);
});

test('settling the last part settles the invoice', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST', body: simpleInvoice({ split_installments: true, installment_count: 2, vat_rate: 0 })
  });
  const { number, id } = await created.json();
  const { rows: parts } = await query('SELECT id FROM invoice_installments WHERE invoice_id = $1 ORDER BY sort', [id]);

  const first = await adminReq(`/api/admin/invoices/${number}/installments/${parts[0].id}/paid`, { method: 'POST' });
  assert.equal((await first.json()).remaining, 1);
  // Paying the same part twice should not count twice.
  assert.equal((await adminReq(`/api/admin/invoices/${number}/installments/${parts[0].id}/paid`, { method: 'POST' })).status, 400);

  const second = await adminReq(`/api/admin/invoices/${number}/installments/${parts[1].id}/paid`, { method: 'POST' });
  assert.equal((await second.json()).remaining, 0);
  const { rows } = await query('SELECT status FROM invoices WHERE number = $1', [number]);
  assert.equal(rows[0].status, 'paid');
});

test('a repeat issues a copy, advances its schedule, and does not issue twice', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST',
    body: simpleInvoice({ recurring_interval: 'monthly', due_on: '2026-03-01' })
  });
  const { number, id } = await created.json();

  // Bring the schedule forward so it is due today.
  await query(`UPDATE invoices SET recurring_next_on = current_date WHERE id = $1`, [id]);

  const first = await runRecurringInvoices();
  assert.equal(first.issued.length, 1);

  const { rows: copies } = await query('SELECT number, amount_cents, status FROM invoices WHERE recurring_parent_id = $1', [id]);
  assert.equal(copies.length, 1);
  assert.equal(copies[0].status, 'due');
  assert.equal(copies[0].amount_cents, 60000);

  // The template has moved on, so a second run on the same day issues nothing.
  const second = await runRecurringInvoices();
  assert.equal(second.issued.includes(copies[0].number), false);
  const { rows } = await query('SELECT recurring_next_on FROM invoices WHERE id = $1', [id]);
  assert.ok(rows[0].recurring_next_on > new Date(new Date().toDateString()));

  await query('DELETE FROM invoices WHERE recurring_parent_id = $1', [id]);
  await query('DELETE FROM invoices WHERE number = $1', [number]);
});

test('a repeat retires itself once it runs past its end date', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST',
    body: simpleInvoice({ recurring_interval: 'monthly', recurring_until: '2026-01-31', due_on: '2026-01-01' })
  });
  const { id } = await created.json();
  await query(`UPDATE invoices SET recurring_next_on = current_date WHERE id = $1`, [id]);

  const run = await runRecurringInvoices();
  const { rows } = await query('SELECT number, recurring_interval, recurring_next_on FROM invoices WHERE id = $1', [id]);
  assert.equal(rows[0].recurring_interval, null, 'the schedule should have been retired');
  assert.equal(rows[0].recurring_next_on, null);
  assert.ok(run.retired.includes(rows[0].number));
  // Nothing was billed: the date it was due has long since passed its end date.
  const { rows: copies } = await query('SELECT count(*)::int AS n FROM invoices WHERE recurring_parent_id = $1', [id]);
  assert.equal(copies[0].n, 0);
  await query('DELETE FROM invoices WHERE recurring_parent_id = $1', [id]);
});

test('a copy is a fresh draft, not a second claim on the same money', async () => {
  const created = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice() });
  const { number } = await created.json();
  const copy = await adminReq(`/api/admin/invoices/${number}/duplicate`, { method: 'POST' });
  assert.equal(copy.status, 201);
  const { number: copyNumber } = await copy.json();
  assert.notEqual(copyNumber, number);

  const { rows } = await query('SELECT status, public_token, advance_paid_cents FROM invoices WHERE number = $1', [copyNumber]);
  assert.equal(rows[0].status, 'draft');
  assert.equal(rows[0].advance_paid_cents, 0);

  const { rows: original } = await query('SELECT public_token FROM invoices WHERE number = $1', [number]);
  assert.notEqual(rows[0].public_token, original[0].public_token, 'a copy must not share the original link');
});

test('a client with invoices cannot be deleted out from under them', async () => {
  const res = await adminReq(`/api/admin/clients/${clientId}`, { method: 'DELETE' });
  assert.equal(res.status, 409);
  assert.match((await res.json()).error, /invoice\(s\)/);
});

test('reopening an invoice keeps its client, bank account and discount', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST',
    body: simpleInvoice({ bank_account_id: bankId, discount_type: 'fixed', discount_value: 25, advance_paid: '40.00' })
  });
  const { number } = await created.json();
  const { document } = await (await adminReq(`/api/admin/invoices/${number}/document`)).json();

  // The printed figures are formatted strings; the builder needs the raw ones,
  // or an edit silently drops whatever it could not read back.
  assert.equal(document.edit.clientId, clientId);
  assert.equal(document.edit.bankAccountId, bankId);
  assert.equal(document.edit.discountType, 'fixed');
  assert.equal(document.edit.discountValue, 25);
  assert.equal(document.edit.advancePaidCents, 4000);
  assert.equal(document.edit.vatRate, 20);
  assert.equal(document.edit.items[0].unit_cents, 50000);

  // Saving straight back through the same fields must change nothing.
  const resaved = await adminReq(`/api/admin/invoices/${number}`, {
    method: 'PATCH',
    body: {
      items: document.edit.items.map((it) => ({ ...it, rate: (it.unit_cents / 100).toFixed(2) })),
      client_id: document.edit.clientId, bank_account_id: document.edit.bankAccountId,
      discount_type: document.edit.discountType, discount_value: document.edit.discountValue,
      advance_paid: (document.edit.advancePaidCents / 100).toFixed(2), vat_rate: document.edit.vatRate
    }
  });
  assert.equal(resaved.status, 200);

  const after = await (await adminReq(`/api/admin/invoices/${number}/document`)).json();
  assert.equal(after.document.billedTo.name, 'Inv Test Acme Ltd');
  assert.equal(after.document.bank.accountName, 'HBBA Global Ltd');
  assert.equal(after.document.totals.discount, '£25.00');
  assert.equal(after.document.totals.advance, '£40.00');
  assert.equal(after.document.totals.due, document.totals.due);
});

test('the owner of an invoice sees the same document a shared link shows', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST',
    body: { items: [{ description: 'Membership', rate: '120.00' }], client: MEMBER, bank_account_id: bankId, vat_rate: 20 }
  });
  const { number } = await created.json();

  const mine = await memberReq(`/api/invoices/${number}`);
  assert.equal(mine.status, 200);
  const { document } = await mine.json();
  assert.equal(document.number, number);
  assert.equal(document.bank.accountName, 'HBBA Global Ltd');
  assert.equal(document.totals.due, '£144.00');

  // And still only their own.
  const other = await adminReq('/api/admin/invoices', { method: 'POST', body: simpleInvoice() });
  const { number: notMine } = await other.json();
  assert.equal((await memberReq(`/api/invoices/${notMine}`)).status, 403);
});

test('a shared link carries the document, not the workspace internals', async () => {
  const created = await adminReq('/api/admin/invoices', {
    method: 'POST', body: simpleInvoice({ bank_account_id: bankId, split_installments: true, installment_count: 2 })
  });
  const { public_token: token } = await created.json();
  const { document } = await (await req(`/api/public/invoices/${token}`)).json();

  // Everything needed to read and pay the invoice is there...
  assert.ok(document.totals.due);
  assert.ok(document.bank.accountName);
  assert.equal(document.installments.length, 2);
  // ...and nothing that only the builder needs.
  assert.equal(document.edit, undefined);
  assert.equal(JSON.stringify(document).includes(clientId), false, 'internal ids must not travel with a public link');
});
