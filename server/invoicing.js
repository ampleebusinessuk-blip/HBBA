// Invoice arithmetic and document assembly.
//
// Kept separate from the HTTP layer because these are the parts that must be
// right: money is integer pence throughout, and the order of operations is
// fixed — line totals, then discount, then VAT on the discounted amount, then
// subtract anything already paid. Charging VAT on money the client is not being
// asked for would overstate the tax.
import { randomBytes } from 'node:crypto';

export const UNITS = ['Service', 'Hour', 'Day', 'Item', 'Month', 'Session', 'Licence'];
export const RECURRING_INTERVALS = ['weekly', 'monthly', 'quarterly', 'yearly'];

/** Pence from a human-entered amount. Never trusts floating point to round. */
export function toCents(value) {
  const n = Number(String(value ?? '').replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function parseItems(input) {
  const rows = Array.isArray(input?.items) ? input.items : [];
  return rows
    .map((row, index) => ({
      description: String(row.description || '').trim(),
      details: String(row.details || '').trim() || null,
      // `unit` is the noun on the line ("Hour"); `rate` is its price.
      unit: UNITS.includes(row.unit) ? row.unit : 'Service',
      qty: Math.max(1, Math.round(Number(row.qty) || 1)),
      unit_cents: Number.isFinite(row.unit_cents)
        ? Math.max(0, Math.round(row.unit_cents))
        : Math.max(0, toCents(row.rate)),
      sort: index
    }))
    .filter((row) => row.description);
}

/**
 * Every figure an invoice prints, derived from its parts.
 * Returns pence; the caller formats.
 */
export function calculateTotals({ items = [], vatRate = 0, discountValue = 0, discountType = 'percent', advancePaidCents = 0 }) {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unit_cents), 0);

  const discount = discountType === 'fixed'
    ? Math.min(subtotal, Math.max(0, toCents(discountValue)))
    : Math.round(subtotal * Math.min(100, Math.max(0, Number(discountValue) || 0)) / 100);

  const net = Math.max(0, subtotal - discount);
  const tax = Math.round(net * (Math.max(0, Number(vatRate) || 0)) / 100);
  const gross = net + tax;
  const advance = Math.min(gross, Math.max(0, Math.round(Number(advancePaidCents) || 0)));

  return {
    subtotal_cents: subtotal,
    discount_cents: discount,
    net_cents: net,
    tax_cents: tax,
    gross_cents: gross,
    advance_paid_cents: advance,
    // What the client is actually asked to pay.
    due_cents: gross - advance
  };
}

/** Opaque, unguessable, and carrying nothing about the invoice it opens. */
export function newPublicToken() {
  return randomBytes(24).toString('base64url');
}

/* A due date is a calendar date, so it is handled as one: three numbers, never
   a timestamp. Doing this arithmetic on a Date lands a day early whenever the
   step crosses a daylight-saving boundary, because the clock moves but the
   calendar did not. */
const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' from a date, a timestamp or a date string. */
export function asDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // A date column comes back from pg as local midnight, so read the local
  // calendar fields rather than converting through UTC.
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DAYS_IN_MONTH = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/**
 * When the next copy of a recurring invoice is due, as 'YYYY-MM-DD'.
 * A day that does not exist in the target month is pulled back to its last day,
 * so a 31st becomes the 28th in February rather than skipping into March.
 */
export function nextOccurrence(from, interval) {
  const start = asDateOnly(from);
  if (!start) return null;
  let [year, month, day] = start.split('-').map(Number);
  month -= 1;

  switch (interval) {
    case 'weekly': {
      const stepped = new Date(Date.UTC(year, month, day + 7));
      return asDateOnly(stepped.toISOString().slice(0, 10));
    }
    case 'monthly': month += 1; break;
    case 'quarterly': month += 3; break;
    case 'yearly': year += 1; break;
    default: return null;
  }
  year += Math.floor(month / 12);
  month = ((month % 12) + 12) % 12;
  return `${year}-${pad(month + 1)}-${pad(Math.min(day, DAYS_IN_MONTH(year, month)))}`;
}

/**
 * Split a total into equal installments, giving the remainder to the first so
 * the parts always add back to the whole.
 */
export function splitInstallments(totalCents, count, firstDue = new Date(), interval = 'monthly') {
  const parts = Math.max(2, Math.min(24, Math.round(Number(count) || 0)));
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - (base * parts);
  const out = [];
  let due = asDateOnly(firstDue);
  for (let i = 0; i < parts; i++) {
    out.push({
      label: `Installment ${i + 1} of ${parts}`,
      amount_cents: base + (i === 0 ? remainder : 0),
      due_on: due,
      sort: i
    });
    if (!due) continue;
    due = nextOccurrence(due, interval);
  }
  return out;
}

/** Validate what an administrator typed, before anything is written. */
export function validateInvoiceInput(input = {}) {
  const fail = (message) => {
    const err = new Error(message);
    err.status = 400;
    throw err;
  };

  const items = parseItems(input);
  if (!items.length) fail('Add at least one line item with a description');
  if (items.some((i) => i.unit_cents === 0) && items.every((i) => i.unit_cents === 0)) {
    fail('At least one line needs an amount');
  }

  const discountType = input.discount_type === 'fixed' ? 'fixed' : 'percent';
  const discountValue = Number(input.discount_value) || 0;
  if (discountValue < 0) fail('A discount cannot be negative');
  if (discountType === 'percent' && discountValue > 100) fail('A percentage discount cannot exceed 100%');

  const vatRate = Number(input.vat_rate) || 0;
  if (vatRate < 0 || vatRate > 100) fail('VAT must be between 0 and 100%');

  const interval = input.recurring_interval || null;
  if (interval && !RECURRING_INTERVALS.includes(interval)) fail('Choose a valid repeat interval');

  const installmentCount = Number(input.installment_count) || 0;
  if (input.split_installments && (installmentCount < 2 || installmentCount > 24)) {
    fail('Split the invoice into between 2 and 24 parts');
  }

  return {
    items,
    documentTitle: String(input.document_title || 'Invoice').trim() || 'Invoice',
    headerColor: String(input.header_color || '').trim() || null,
    clientId: input.client_id || null,
    poRef: String(input.po_ref || '').trim() || null,
    serviceCategory: String(input.service_category || '').trim() || null,
    locationMode: String(input.location_mode || '').trim() || null,
    deliveryPeriod: String(input.delivery_period || '').trim() || null,
    bankAccountId: input.bank_account_id || null,
    currency: String(input.currency || 'GBP').trim().toUpperCase().slice(0, 3),
    vatRate,
    discountType,
    discountValue,
    advancePaidCents: Math.max(0, toCents(input.advance_paid ?? 0)),
    notes: String(input.notes || '').trim() || null,
    dueOn: input.due_on || null,
    status: ['draft', 'sent', 'due', 'paid'].includes(input.status) ? input.status : 'due',
    allowCardPayment: input.allow_card_payment === true,
    recurringInterval: interval,
    recurringUntil: input.recurring_until || null,
    splitInstallments: input.split_installments === true,
    installmentCount
  };
}
