// The arithmetic an invoice depends on, and the money it prints. These are
// pure functions on purpose: the order of operations is the part that must be
// right, and it should be checkable without a database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toCents, parseItems, calculateTotals, newPublicToken, nextOccurrence,
  splitInstallments, validateInvoiceInput, asDateOnly, UNITS
} from '../server/invoicing.js';

test('amounts become whole pence, however they were typed', () => {
  assert.equal(toCents('12.34'), 1234);
  assert.equal(toCents('£1,250.00'), 125000);
  assert.equal(toCents('0.1'), 10);
  // The classic float trap: 19.99 * 100 is 1998.9999... in binary.
  assert.equal(toCents('19.99'), 1999);
  assert.equal(toCents(''), 0);
  assert.equal(toCents('not a number'), 0);
});

test('a line carries its unit as a noun and its rate as a price', () => {
  const [item] = parseItems({ items: [{ description: 'Consultancy', unit: 'Hour', qty: '3', rate: '85.50' }] });
  assert.equal(item.unit, 'Hour');
  assert.equal(item.qty, 3);
  assert.equal(item.unit_cents, 8550);
});

test('an unknown unit falls back rather than being stored', () => {
  const [item] = parseItems({ items: [{ description: 'Thing', unit: 'Parsec', rate: '1' }] });
  assert.ok(UNITS.includes(item.unit));
  assert.equal(item.unit, 'Service');
});

test('lines without a description are dropped, not billed', () => {
  const items = parseItems({ items: [{ description: '', rate: '100' }, { description: 'Real', rate: '50' }] });
  assert.equal(items.length, 1);
  assert.equal(items[0].description, 'Real');
});

test('VAT is charged on the discounted amount, not the full one', () => {
  const totals = calculateTotals({
    items: [{ qty: 1, unit_cents: 100000 }],
    vatRate: 20, discountValue: 10, discountType: 'percent'
  });
  assert.equal(totals.subtotal_cents, 100000);
  assert.equal(totals.discount_cents, 10000);
  assert.equal(totals.net_cents, 90000);
  // 20% of 900.00, not of 1000.00 — the client is never asked for the £1,000.
  assert.equal(totals.tax_cents, 18000);
  assert.equal(totals.gross_cents, 108000);
});

test('a fixed discount cannot exceed the subtotal', () => {
  const totals = calculateTotals({
    items: [{ qty: 1, unit_cents: 5000 }],
    discountValue: 999, discountType: 'fixed'
  });
  assert.equal(totals.discount_cents, 5000);
  assert.equal(totals.net_cents, 0);
  assert.equal(totals.due_cents, 0);
});

test('money already paid reduces what is due but not what is charged', () => {
  const totals = calculateTotals({
    items: [{ qty: 2, unit_cents: 25000 }],
    vatRate: 20, advancePaidCents: 10000
  });
  assert.equal(totals.gross_cents, 60000);
  assert.equal(totals.advance_paid_cents, 10000);
  assert.equal(totals.due_cents, 50000);
});

test('an advance larger than the invoice leaves nothing owing, never a credit', () => {
  const totals = calculateTotals({ items: [{ qty: 1, unit_cents: 1000 }], advancePaidCents: 999999 });
  assert.equal(totals.advance_paid_cents, 1000);
  assert.equal(totals.due_cents, 0);
});

test('a public token is long, random and URL-safe', () => {
  const a = newPublicToken();
  const b = newPublicToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 32, `token was only ${a.length} characters`);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test('each repeat interval advances the date it should', () => {
  assert.equal(nextOccurrence('2026-01-31', 'weekly'), '2026-02-07');
  assert.equal(nextOccurrence('2026-01-15', 'monthly'), '2026-02-15');
  assert.equal(nextOccurrence('2026-01-15', 'quarterly'), '2026-04-15');
  assert.equal(nextOccurrence('2026-01-15', 'yearly'), '2027-01-15');
  assert.equal(nextOccurrence('2026-12-15', 'monthly'), '2027-01-15');
  assert.equal(nextOccurrence('2026-01-31', 'fortnightly'), null);
});

test('a repeat never skips a month because the day does not exist', () => {
  // The 31st has no counterpart in February, so it settles on the last day
  // rather than overflowing into March and billing a month late.
  assert.equal(nextOccurrence('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(nextOccurrence('2026-08-31', 'monthly'), '2026-09-30');
});

test('a monthly repeat across a clock change stays on its calendar day', () => {
  // British Summer Time starts on 29 March 2026. Stepping a timestamp would
  // land on the 31st of March; stepping a calendar date does not.
  assert.equal(nextOccurrence('2026-03-01', 'monthly'), '2026-04-01');
  assert.equal(nextOccurrence('2026-10-15', 'monthly'), '2026-11-15');
});

test('installments always add back to the whole, remainder to the first', () => {
  const parts = splitInstallments(10000, 3, '2026-03-01');
  assert.equal(parts.length, 3);
  assert.equal(parts.reduce((n, p) => n + p.amount_cents, 0), 10000);
  assert.equal(parts[0].amount_cents, 3334);
  assert.equal(parts[1].amount_cents, 3333);
  assert.equal(parts[0].due_on, '2026-03-01');
  assert.equal(parts[1].due_on, '2026-04-01');
  assert.equal(parts[2].due_on, '2026-05-01');
});

test('an invoice must have something to bill for', () => {
  assert.throws(() => validateInvoiceInput({ items: [] }), /at least one line item/i);
});

test('impossible discounts and VAT rates are refused with a reason', () => {
  const items = [{ description: 'Work', rate: '100' }];
  assert.throws(() => validateInvoiceInput({ items, discount_value: 150 }), /cannot exceed 100%/);
  assert.throws(() => validateInvoiceInput({ items, discount_value: -1 }), /cannot be negative/);
  assert.throws(() => validateInvoiceInput({ items, vat_rate: 120 }), /between 0 and 100/);
  assert.throws(() => validateInvoiceInput({ items, recurring_interval: 'daily' }), /valid repeat interval/);
  assert.throws(() => validateInvoiceInput({ items, split_installments: true, installment_count: 1 }), /between 2 and 24/);
});

test('validation normalises what it accepts', () => {
  const input = validateInvoiceInput({
    items: [{ description: 'Sponsorship', unit: 'Month', qty: 12, rate: '250' }],
    currency: 'gbp', document_title: '  Proforma  ', status: 'nonsense',
    discount_type: 'fixed', advance_paid: '100.50', allow_card_payment: true
  });
  assert.equal(input.currency, 'GBP');
  assert.equal(input.documentTitle, 'Proforma');
  // An unrecognised status falls back to the safe default rather than erroring.
  assert.equal(input.status, 'due');
  assert.equal(input.discountType, 'fixed');
  assert.equal(input.advancePaidCents, 10050);
  assert.equal(input.allowCardPayment, true);
});

test('a date column is read as the day it says, whatever the clock is doing', () => {
  // pg hands back a date column as local midnight. Formatting that through UTC
  // loses a day wherever the offset is positive, which in summer is here.
  assert.equal(asDateOnly('2026-07-15'), '2026-07-15');
  assert.equal(asDateOnly(new Date(2026, 6, 15)), '2026-07-15');
  assert.equal(asDateOnly('2026-07-15T00:00:00.000Z'), '2026-07-15');
  assert.equal(asDateOnly(null), null);
  assert.equal(asDateOnly('nonsense'), null);
});
