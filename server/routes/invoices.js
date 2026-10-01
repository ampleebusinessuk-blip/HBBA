import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { logActivity } from '../activity.js';
import { requirePermission } from '../permissions.js';
import {
  validateInvoiceInput, calculateTotals, newPublicToken, nextOccurrence,
  splitInstallments, asDateOnly, UNITS
} from '../invoicing.js';
import { businessProfile, listBankAccounts } from '../settings.js';
import { sendEmail, layout, appUrl, emailConfigured } from '../email.js';
import { paymentsConfigured, createInvoiceCheckout } from '../payments.js';
import { demoPayments } from '../demo.js';

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);
const adminOnly = requireRole('admin');

const money = (cents, currency = 'GBP') =>
  (currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '') + (Number(cents) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const todayISO = () => new Date().toISOString().slice(0, 10);
const dateISO = asDateOnly;

// Display status: auto-flag overdue when past due and still unpaid.
function effectiveStatus(row) {
  const due = dateISO(row.due_on);
  if ((row.status === 'due' || row.status === 'sent') && due && due < todayISO()) return 'overdue';
  return row.status;
}

/** Everything the printed document needs, in one place. */
export async function invoiceDocument(row) {
  const [items, installments, business, banks] = await Promise.all([
    query('SELECT description, details, unit, qty, unit_cents FROM invoice_items WHERE invoice_id = $1 ORDER BY sort, description', [row.id]),
    query('SELECT id, label, due_on, amount_cents, status, paid_at FROM invoice_installments WHERE invoice_id = $1 ORDER BY sort', [row.id]),
    businessProfile(),
    listBankAccounts()
  ]);

  const client = row.client_id
    ? (await query('SELECT * FROM clients WHERE id = $1', [row.client_id])).rows[0]
    : null;
  const account = row.bank_account_id
    ? banks.find((b) => b.id === row.bank_account_id) || null
    : banks.find((b) => b.is_default) || null;

  const totals = calculateTotals({
    items: items.rows,
    vatRate: Number(row.vat_rate) || 0,
    discountValue: Number(row.discount_value) || 0,
    discountType: row.discount_type,
    advancePaidCents: row.advance_paid_cents
  });

  const cash = (cents) => money(cents, row.currency);
  return {
    number: row.number,
    documentTitle: row.document_title || 'Invoice',
    headerColor: row.header_color || '#1f3a73',
    status: effectiveStatus(row),
    issued: row.issued_on,
    due: dateISO(row.due_on),
    poRef: row.po_ref || '',
    serviceCategory: row.service_category || '',
    locationMode: row.location_mode || '',
    deliveryPeriod: row.delivery_period || '',
    currency: row.currency,
    notes: row.notes || '',
    billedBy: business,
    billedTo: client
      ? {
        name: client.name,
        contact: client.contact_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: [client.address, client.city, client.postcode, client.country].filter(Boolean).join(', '),
        registrationNo: client.registration_no || '',
        vatNo: client.vat_no || ''
      }
      : (row.client_name ? { name: row.client_name, email: row.client_email || '' } : null),
    bank: account
      ? {
        accountName: account.account_name, bankName: account.bank_name || '',
        accountNumber: account.account_number || '', sortCode: account.sort_code || '',
        iban: account.iban || '', swift: account.swift || '', accountType: account.account_type || ''
      }
      : null,
    items: items.rows.map((it) => ({
      description: it.description, details: it.details || '', unit: it.unit, qty: it.qty,
      rate: cash(it.unit_cents), line: cash(it.qty * it.unit_cents)
    })),
    installments: installments.rows.map((p) => ({
      label: p.label, due: dateISO(p.due_on), amount: cash(p.amount_cents), status: p.status
    })),
    totals: {
      subtotal: cash(totals.subtotal_cents),
      discount: totals.discount_cents ? cash(totals.discount_cents) : null,
      discountLabel: row.discount_type === 'fixed' ? 'Discount' : `Discount (${Number(row.discount_value) || 0}%)`,
      net: cash(totals.net_cents),
      vatRate: Number(row.vat_rate) || 0,
      tax: cash(totals.tax_cents),
      gross: cash(totals.gross_cents),
      advance: totals.advance_paid_cents ? cash(totals.advance_paid_cents) : null,
      due: cash(totals.due_cents),
      due_cents: totals.due_cents
    },
    signature: row.signed_at
      ? { name: row.signed_name, at: row.signed_at, ip: row.signed_ip }
      : null,
    recurring: row.recurring_interval
      ? { interval: row.recurring_interval, nextOn: dateISO(row.recurring_next_on), until: dateISO(row.recurring_until) }
      : null,
    allowCardPayment: row.allow_card_payment === true,
    publicToken: row.public_token || null,
    // The raw values, for reopening this document in the builder. Without them
    // an edit would have to guess the client and bank account back from their
    // printed names, and would quietly drop both.
    edit: {
      clientId: row.client_id || null,
      bankAccountId: row.bank_account_id || null,
      discountType: row.discount_type,
      discountValue: Number(row.discount_value) || 0,
      advancePaidCents: row.advance_paid_cents || 0,
      status: row.status,
      currency: row.currency,
      vatRate: Number(row.vat_rate) || 0,
      items: items.rows.map((it) => ({
        description: it.description, details: it.details || '',
        unit: it.unit, qty: it.qty, unit_cents: it.unit_cents
      })),
      installments: installments.rows.map((part) => ({
        id: part.id, label: part.label, status: part.status, amount_cents: part.amount_cents
      }))
    }
  };
}

async function fetchInvoice(number) {
  const inv = await query('SELECT * FROM invoices WHERE number = $1', [number]);
  if (!inv.rows[0]) return null;
  const items = await query(
    'SELECT description, details, unit, qty, unit_cents FROM invoice_items WHERE invoice_id = $1 ORDER BY sort, description',
    [inv.rows[0].id]);
  return { ...inv.rows[0], items: items.rows };
}

function invoiceDTO(row, { full = false } = {}) {
  const status = effectiveStatus(row);
  const base = {
    id: row.number, number: row.number, client: row.client_name || null,
    amount: money(row.amount_cents, row.currency), amount_cents: row.amount_cents,
    issued: row.issued_on, due: dateISO(row.due_on), status,
    vat_rate: Number(row.vat_rate) || 0, pdf: row.pdf_url || null,
    title: row.document_title || 'Invoice',
    client_id: row.client_id || null,
    share_token: row.public_token || null,
    signed: Boolean(row.signed_at),
    recurring: row.recurring_interval || null,
    due_cents: Math.max(0, (row.amount_cents || 0) - (row.advance_paid_cents || 0))
  };
  if (!full) return base;
  return {
    ...base,
    currency: row.currency,
    subtotal: money(row.subtotal_cents, row.currency),
    tax: money(row.tax_cents, row.currency),
    total: money(row.amount_cents, row.currency),
    notes: row.notes || null,
    reminder_count: row.reminder_count || 0,
    items: (row.items || []).map((it) => ({
      description: it.description, details: it.details || null, qty: it.qty,
      unit: money(it.unit_cents, row.currency), line: money(it.qty * it.unit_cents, row.currency)
    }))
  };
}

// --- Admin list ---
invoicesRouter.get('/admin/invoices', requirePermission('invoices.manage'), async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT i.*,
             coalesce(c.name, u.full_name) AS client_name,
             coalesce(c.email, u.email)    AS client_email
        FROM invoices i
        LEFT JOIN users u   ON u.id = i.user_id
        LEFT JOIN clients c ON c.id = i.client_id
       ORDER BY i.created_at DESC`);
    res.json({ invoices: rows.map((r) => invoiceDTO(r)) });
  } catch (err) { next(err); }
});

// --- Single invoice (admin or the owner) ---
// The owner gets the same document a client would see from a shared link: the
// bank details, the discount, anything already paid, the signature. A member
// looking at their own bill should not see less than a stranger with a link.
invoicesRouter.get('/invoices/:number', async (req, res, next) => {
  try {
    const row = await fetchInvoice(req.params.number);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    if (req.auth.role !== 'admin' && row.user_id !== req.auth.sub) return res.status(403).json({ error: 'Forbidden' });
    const u = row.user_id ? await query('SELECT full_name, email, org FROM users WHERE id = $1', [row.user_id]) : { rows: [] };
    res.json({
      invoice: { ...invoiceDTO({ ...row, client_name: u.rows[0]?.full_name }, { full: true }), client: u.rows[0] || null },
      document: await invoiceDocument(row)
    });
  } catch (err) { next(err); }
});

// --- Create (admin) ---
invoicesRouter.post('/admin/invoices', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    let input;
    try {
      input = validateInvoiceInput(req.body);
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }

    const totals = calculateTotals({
      items: input.items, vatRate: input.vatRate,
      discountValue: input.discountValue, discountType: input.discountType,
      advancePaidCents: input.advancePaidCents
    });

    // A portal account is optional: an invoice may be addressed to a client
    // record, to a user, or simply to a typed name.
    let userId = null;
    if (input.clientId) {
      const { rows } = await query('SELECT user_id FROM clients WHERE id = $1', [input.clientId]);
      if (!rows[0]) return res.status(400).json({ error: 'That client no longer exists' });
      userId = rows[0].user_id;
    } else if (req.body?.client && String(req.body.client).includes('@')) {
      const u = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [String(req.body.client).trim()]);
      userId = u.rows[0]?.id || null;
    }

    const business = await businessProfile();
    const number = `${business.invoicePrefix || 'INV'}-${Date.now().toString().slice(-8)}`;
    const title = String(req.body?.description || '').trim() || input.items[0].description;

    const inv = await query(
      `INSERT INTO invoices (
         number, user_id, client_id, description, amount_cents, subtotal_cents, tax_cents, vat_rate,
         discount_type, discount_value, discount_cents, advance_paid_cents,
         issued_on, due_on, status, notes, currency,
         document_title, header_color, po_ref, service_category, location_mode, delivery_period,
         bank_account_id, allow_card_payment, public_token,
         recurring_interval, recurring_next_on, recurring_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
       RETURNING *`,
      [number, userId, input.clientId, title, totals.gross_cents, totals.subtotal_cents, totals.tax_cents, input.vatRate,
        input.discountType, input.discountValue, totals.discount_cents, totals.advance_paid_cents,
        req.body?.issued || todayISO(), input.dueOn, input.status, input.notes, input.currency,
        input.documentTitle, input.headerColor, input.poRef, input.serviceCategory, input.locationMode, input.deliveryPeriod,
        input.bankAccountId, input.allowCardPayment, newPublicToken(),
        input.recurringInterval,
        input.recurringInterval ? nextOccurrence(input.dueOn || new Date(), input.recurringInterval) : null,
        input.recurringUntil]);
    const invoice = inv.rows[0];

    for (const item of input.items) {
      await query(
        `INSERT INTO invoice_items (invoice_id, description, details, unit, qty, unit_cents, sort)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [invoice.id, item.description, item.details, item.unit, item.qty, item.unit_cents, item.sort]);
    }

    if (input.splitInstallments) {
      const parts = splitInstallments(totals.due_cents, input.installmentCount, input.dueOn || new Date());
      for (const part of parts) {
        await query(
          `INSERT INTO invoice_installments (invoice_id, label, due_on, amount_cents, sort)
           VALUES ($1,$2,$3,$4,$5)`,
          [invoice.id, part.label, part.due_on, part.amount_cents, part.sort]);
      }
    }

    await logActivity({ kind: 'invoice', title: 'Invoice created', body: `${number} · ${money(totals.gross_cents, input.currency)}`, tone: 'blue' });
    if (userId) {
      await logActivity({
        kind: 'invoice', title: 'New invoice', body: `${number} · ${money(totals.gross_cents, input.currency)}`,
        tone: 'blue', role: 'all', userId
      });
    }
    res.status(201).json({ number, id: invoice.id, public_token: invoice.public_token, totals });
  } catch (err) { next(err); }
});

// What the builder needs to offer: clients, bank accounts, units, and the
// business identity that will be printed.
invoicesRouter.get('/admin/invoices/options', requirePermission('invoices.manage'), async (_req, res, next) => {
  try {
    const [clients, banks, business] = await Promise.all([
      query('SELECT id, name, email, vat_no FROM clients ORDER BY lower(name)'),
      listBankAccounts(),
      businessProfile()
    ]);
    res.json({
      clients: clients.rows,
      bankAccounts: banks.map((b) => ({ id: b.id, label: b.label, account_name: b.account_name, is_default: b.is_default })),
      units: UNITS,
      business
    });
  } catch (err) { next(err); }
});

// --- Edit (admin) ---
// Any part of the document may be revised while it is open. Re-lining the
// invoice recomputes every figure rather than trusting what the browser sent.
const EDITABLE_COLUMNS = {
  document_title: 'documentTitle', header_color: 'headerColor', po_ref: 'poRef',
  service_category: 'serviceCategory', location_mode: 'locationMode',
  delivery_period: 'deliveryPeriod', client_id: 'clientId',
  bank_account_id: 'bankAccountId', allow_card_payment: 'allowCardPayment',
  currency: 'currency', notes: 'notes'
};

invoicesRouter.patch('/admin/invoices/:number', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    const row = await fetchInvoice(req.params.number);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    if (row.status === 'paid' && Array.isArray(req.body?.items)) {
      return res.status(409).json({ error: 'A paid invoice cannot be re-lined. Void it and raise a new one.' });
    }

    const fields = [];
    const vals = [];
    const set = (column, value) => { vals.push(value); fields.push(`${column} = $${vals.length}`); };

    if (req.body?.status && ['draft', 'sent', 'due', 'paid', 'overdue', 'void'].includes(req.body.status)) {
      set('status', req.body.status);
    }
    if (req.body?.due_on !== undefined) set('due_on', req.body.due_on || null);
    if (req.body?.issued !== undefined) set('issued_on', req.body.issued || todayISO());

    // Re-lining the invoice: validate the whole document, then recompute.
    if (Array.isArray(req.body?.items)) {
      let input;
      try {
        input = validateInvoiceInput({
          vat_rate: row.vat_rate, discount_type: row.discount_type,
          discount_value: row.discount_value, currency: row.currency,
          ...req.body
        });
      } catch (err) {
        return res.status(err.status || 400).json({ error: err.message });
      }

      const sums = calculateTotals({
        items: input.items, vatRate: input.vatRate,
        discountValue: input.discountValue, discountType: input.discountType,
        advancePaidCents: input.advancePaidCents
      });

      await query('DELETE FROM invoice_items WHERE invoice_id = $1', [row.id]);
      for (const item of input.items) {
        await query(
          `INSERT INTO invoice_items (invoice_id, description, details, unit, qty, unit_cents, sort)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [row.id, item.description, item.details, item.unit, item.qty, item.unit_cents, item.sort]);
      }

      set('subtotal_cents', sums.subtotal_cents);
      set('discount_cents', sums.discount_cents);
      set('tax_cents', sums.tax_cents);
      set('amount_cents', sums.gross_cents);
      set('advance_paid_cents', sums.advance_paid_cents);
      set('vat_rate', input.vatRate);
      set('discount_type', input.discountType);
      set('discount_value', input.discountValue);
      set('description', String(req.body?.description || '').trim() || input.items[0].description);

      for (const [column, key] of Object.entries(EDITABLE_COLUMNS)) {
        if (req.body[column] !== undefined) set(column, input[key]);
      }
    } else {
      // A light edit: only the plain document fields.
      if (req.body?.notes !== undefined) set('notes', req.body.notes || null);
      for (const column of ['document_title', 'header_color', 'po_ref', 'service_category',
        'location_mode', 'delivery_period', 'bank_account_id', 'client_id']) {
        if (req.body?.[column] !== undefined) set(column, req.body[column] || null);
      }
      if (req.body?.allow_card_payment !== undefined) set('allow_card_payment', req.body.allow_card_payment === true);
    }

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(row.id);
    const { rows } = await query(
      `UPDATE invoices SET ${fields.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals);
    res.json({ ok: true, invoice: invoiceDTO(rows[0]) });
  } catch (err) { next(err); }
});

// The printable document, for the builder's preview and the admin's own copy.
invoicesRouter.get('/admin/invoices/:number/document', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM invoices WHERE number = $1', [req.params.number]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ document: await invoiceDocument(rows[0]), share: shareLink(rows[0]) });
  } catch (err) { next(err); }
});

// A shareable link the client opens without an account. Rotating it revokes the
// old one, which is the only way to take a sent link back.
invoicesRouter.post('/admin/invoices/:number/share', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    const token = req.body?.rotate === true ? newPublicToken() : null;
    const { rows } = await query(
      `UPDATE invoices
          SET public_token = coalesce($2, public_token, $3),
              allow_card_payment = coalesce($4, allow_card_payment)
        WHERE number = $1
       RETURNING *`,
      [req.params.number, token, newPublicToken(),
        req.body?.allow_card_payment === undefined ? null : req.body.allow_card_payment === true]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ url: shareLink(rows[0]), token: rows[0].public_token, rotated: Boolean(token) });
  } catch (err) { next(err); }
});

// Email the client their link. Falls back to reporting why it could not go.
invoicesRouter.post('/admin/invoices/:number/send', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE invoices
          SET public_token = coalesce(public_token, $2),
              status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END
        WHERE number = $1 RETURNING *`, [req.params.number, newPublicToken()]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    const row = rows[0];

    const to = String(req.body?.to || '').trim() || await invoiceRecipient(row);
    if (!to) return res.status(400).json({ error: 'No email address for this invoice' });

    const amount = money(row.amount_cents - row.advance_paid_cents, row.currency);
    const out = await sendEmail({
      to,
      subject: `${row.document_title || 'Invoice'} ${row.number} — ${amount}`,
      kind: 'invoice-send',
      html: layout({
        heading: `${row.document_title || 'Invoice'} ${row.number}`,
        body: `<p>${amount} is ${row.due_on ? `due by ${dateISO(row.due_on)}` : 'now due'}.</p>
               <p>Open the link below to view the full invoice, download it, or pay.</p>`,
        cta: { url: shareLink(row), label: 'View invoice' }
      }),
      text: `${row.document_title || 'Invoice'} ${row.number} for ${amount}: ${shareLink(row)}`
    });

    const delivery = out.sent ? `emailed to ${to}` : out.skipped ? 'recorded — email delivery is not connected' : `email failed: ${out.error}`;
    await logActivity({ kind: 'invoice', title: 'Invoice sent', body: `${row.number} — ${delivery}`, tone: 'blue' });
    res.json({ ok: out.sent === true, delivery, url: shareLink(row), emailConnected: emailConfigured() });
  } catch (err) { next(err); }
});

// Mark one part of a split invoice as settled, and the whole invoice when the
// last part lands.
invoicesRouter.post('/admin/invoices/:number/installments/:id/paid',
  requirePermission('invoices.manage'), async (req, res, next) => {
    try {
      const inv = await query('SELECT id, number FROM invoices WHERE number = $1', [req.params.number]);
      if (!inv.rows[0]) return res.status(404).json({ error: 'Invoice not found' });
      const { rows } = await query(
        `UPDATE invoice_installments SET status = 'paid', paid_at = now()
          WHERE id = $1 AND invoice_id = $2 AND status <> 'paid' RETURNING label, amount_cents`,
        [req.params.id, inv.rows[0].id]);
      if (!rows[0]) return res.status(400).json({ error: 'That part is already settled, or does not exist' });

      const open = await query(
        `SELECT count(*)::int AS n FROM invoice_installments WHERE invoice_id = $1 AND status <> 'paid'`,
        [inv.rows[0].id]);
      if (open.rows[0].n === 0) {
        await query(`UPDATE invoices SET status = 'paid', paid_at = now() WHERE id = $1 AND status <> 'paid'`, [inv.rows[0].id]);
      }
      await logActivity({
        kind: 'invoice', title: 'Installment settled',
        body: `${inv.rows[0].number} · ${rows[0].label} · ${money(rows[0].amount_cents)}`, tone: 'green'
      });
      res.json({ ok: true, remaining: open.rows[0].n });
    } catch (err) { next(err); }
  });

// Copy an invoice as a fresh draft — the usual way to bill the same work again.
invoicesRouter.post('/admin/invoices/:number/duplicate', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM invoices WHERE number = $1', [req.params.number]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    const copy = await copyInvoice(rows[0], { status: 'draft' });
    res.status(201).json({ number: copy.number });
  } catch (err) { next(err); }
});

invoicesRouter.delete('/admin/invoices/:number', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    const { rowCount } = await query(`UPDATE invoices SET status = 'void' WHERE number = $1`, [req.params.number]);
    if (!rowCount) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Chase an unpaid invoice: bump the reminder count and email the client.
invoicesRouter.post('/admin/invoices/:number/remind', requirePermission('invoices.manage'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE invoices SET reminder_count = reminder_count + 1, reminded_at = now(),
              status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END
        WHERE number = $1
       RETURNING number, amount_cents, currency, due_on, user_id`, [req.params.number]);
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });

    let delivery = 'no client account on this invoice';
    if (rows[0].user_id) {
      const client = await query('SELECT email, full_name FROM users WHERE id = $1', [rows[0].user_id]);
      if (client.rows[0]) {
        const amount = money(rows[0].amount_cents, rows[0].currency);
        const out = await sendEmail({
          to: client.rows[0].email,
          subject: `Reminder: invoice ${rows[0].number} (${amount})`,
          kind: 'invoice-reminder',
          html: layout({
            heading: `Invoice ${rows[0].number} is outstanding`,
            body: `<p>Hi ${client.rows[0].full_name},</p><p>A friendly reminder that invoice <strong>${rows[0].number}</strong> for <strong>${amount}</strong> is still open${rows[0].due_on ? ` (due ${dateISO(rows[0].due_on)})` : ''}.</p>`,
            cta: { url: `${appUrl()}/#myInvoices`, label: 'View and pay' }
          }),
          text: `Invoice ${rows[0].number} for ${amount} is outstanding: ${appUrl()}/#myInvoices`
        });
        delivery = out.sent ? 'emailed the client' : out.skipped ? 'recorded — email delivery is not connected' : `email failed: ${out.error}`;
        await logActivity({
          kind: 'invoice', title: 'Payment reminder', body: `${rows[0].number} — ${delivery}`,
          tone: 'orange', role: 'all', userId: rows[0].user_id
        });
      }
    }
    await logActivity({ kind: 'invoice', title: 'Reminder sent', body: `${rows[0].number} — ${delivery}`, tone: 'orange' });
    res.json({ ok: true, delivery, emailConnected: emailConfigured() });
  } catch (err) { next(err); }
});

// Owner pays an invoice. Stripe-gated: builds a checkout when configured, else 503.
invoicesRouter.post('/invoices/:number/pay', async (req, res, next) => {
  try {
    const row = await fetchInvoice(req.params.number);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    if (req.auth.role !== 'admin' && row.user_id !== req.auth.sub) return res.status(403).json({ error: 'Forbidden' });
    if (row.status === 'paid') return res.status(400).json({ error: 'Invoice already paid' });
    if (!paymentsConfigured()) {
      if (!demoPayments(paymentsConfigured())) {
        return res.status(503).json({ error: 'Online payments are not connected yet' });
      }
      // Demo mode: hand the client a confirmation step instead of a checkout URL.
      return res.json({
        demo: true,
        amount: money(row.amount_cents, row.currency),
        message: 'Demo payment — no card is charged and no money moves.'
      });
    }
    const url = await createInvoiceCheckout(row);
    await logActivity({ kind: 'invoice', title: 'Payment started', body: row.number, tone: 'green' });
    res.json({ url });
  } catch (err) { next(err); }
});

// Settle an invoice in demo mode. Refused the moment real payments are live,
// and the record is stamped 'demo' so it can never be mistaken for a charge.
invoicesRouter.post('/invoices/:number/pay/demo', async (req, res, next) => {
  try {
    if (paymentsConfigured()) return res.status(409).json({ error: 'Stripe is live — use the real checkout' });
    if (!demoPayments(paymentsConfigured())) return res.status(503).json({ error: 'Demo payments are disabled' });

    const row = await fetchInvoice(req.params.number);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    if (req.auth.role !== 'admin' && row.user_id !== req.auth.sub) return res.status(403).json({ error: 'Forbidden' });
    if (row.status === 'paid') return res.status(400).json({ error: 'Invoice already paid' });

    const { rows } = await query(
      `UPDATE invoices SET status = 'paid', paid_at = now(), payment_ref = $2
        WHERE number = $1 AND status <> 'paid' RETURNING number, amount_cents, currency, user_id`,
      [req.params.number, `demo-${Date.now()}`]);
    if (!rows[0]) return res.status(400).json({ error: 'Invoice already paid' });

    const amount = money(rows[0].amount_cents, rows[0].currency);
    await logActivity({ kind: 'invoice', title: 'Invoice paid (demo)', body: `${rows[0].number} · ${amount} — no card charged`, tone: 'green' });
    if (rows[0].user_id) {
      await logActivity({
        kind: 'invoice', title: 'Payment recorded (demo)', body: `${rows[0].number} · ${amount}`,
        tone: 'green', role: 'all', userId: rows[0].user_id
      });
    }
    res.json({ ok: true, demo: true, number: rows[0].number, amount });
  } catch (err) { next(err); }
});

/** The absolute link a client opens. Bare token; nothing else is needed. */
function shareLink(row) {
  return row.public_token ? `${appUrl()}/invoice.html#${row.public_token}` : null;
}

/** Who to email about an invoice: its client record first, then its user. */
async function invoiceRecipient(row) {
  if (row.client_id) {
    const { rows } = await query('SELECT email FROM clients WHERE id = $1', [row.client_id]);
    if (rows[0]?.email) return rows[0].email;
  }
  if (row.user_id) {
    const { rows } = await query('SELECT email FROM users WHERE id = $1', [row.user_id]);
    if (rows[0]?.email) return rows[0].email;
  }
  return null;
}

/**
 * Duplicate an invoice, lines and all. Used by both the Duplicate button and
 * the recurring schedule, so a repeat is identical to a hand-made copy.
 */
async function copyInvoice(row, { status = 'due', dueOn = null, parentId = null, carryRecurrence = false } = {}) {
  const business = await businessProfile();
  const number = `${business.invoicePrefix || 'INV'}-${Date.now().toString().slice(-8)}`;
  const { rows } = await query(
    `INSERT INTO invoices (
       number, user_id, client_id, description, amount_cents, subtotal_cents, tax_cents, vat_rate,
       discount_type, discount_value, discount_cents, advance_paid_cents,
       issued_on, due_on, status, notes, currency,
       document_title, header_color, po_ref, service_category, location_mode, delivery_period,
       bank_account_id, allow_card_payment, public_token,
       recurring_interval, recurring_next_on, recurring_until, recurring_parent_id)
     SELECT $1, user_id, client_id, description, amount_cents, subtotal_cents, tax_cents, vat_rate,
            discount_type, discount_value, discount_cents, 0,
            $2, $3, $4, notes, currency,
            document_title, header_color, po_ref, service_category, location_mode, delivery_period,
            bank_account_id, allow_card_payment, $5,
            $6, $7, recurring_until, $8
       FROM invoices WHERE id = $9
     RETURNING *`,
    [number, todayISO(), dueOn, status, newPublicToken(),
      carryRecurrence ? row.recurring_interval : null,
      carryRecurrence ? nextOccurrence(dueOn || new Date(), row.recurring_interval) : null,
      parentId, row.id]);

  await query(
    `INSERT INTO invoice_items (invoice_id, description, details, unit, qty, unit_cents, sort)
     SELECT $1, description, details, unit, qty, unit_cents, sort
       FROM invoice_items WHERE invoice_id = $2`, [rows[0].id, row.id]);
  return rows[0];
}

/**
 * Issue every repeat invoice that has come due. Driven by the daily cron.
 * The schedule lives on the template; each copy points back to it.
 */
export async function runRecurringInvoices({ today = todayISO() } = {}) {
  // Every schedule whose date has arrived, including ones that have run past
  // their end date: those are retired here rather than left behind as a
  // schedule that will never fire again.
  const { rows } = await query(
    `SELECT * FROM invoices
      WHERE recurring_interval IS NOT NULL
        AND recurring_next_on IS NOT NULL
        AND recurring_next_on <= $1
        AND status <> 'void'`, [today]);

  const issued = [];
  const retired = [];
  const retire = (id) => query(
    'UPDATE invoices SET recurring_interval = NULL, recurring_next_on = NULL WHERE id = $1', [id]);

  for (const template of rows) {
    const due = dateISO(template.recurring_next_on);
    const until = dateISO(template.recurring_until);

    if (until && due > until) {
      await retire(template.id);
      retired.push(template.number);
      continue;
    }

    const copy = await copyInvoice(template, { status: 'due', dueOn: due, parentId: template.id });

    // Advance the schedule, and retire it once the next one would fall past the
    // end date — there is no point keeping a schedule that cannot fire.
    const next = nextOccurrence(due, template.recurring_interval);
    if (!next || (until && next > until)) {
      await retire(template.id);
      retired.push(template.number);
    } else {
      await query('UPDATE invoices SET recurring_next_on = $2 WHERE id = $1', [template.id, next]);
    }

    issued.push(copy.number);
    await logActivity({
      kind: 'invoice', title: 'Recurring invoice issued',
      body: `${copy.number} from ${template.number} · ${money(copy.amount_cents, copy.currency)}`, tone: 'blue'
    });
  }
  return { issued, retired };
}

/* ===================== PUBLIC INVOICE (no account) ===================== */

// Mounted ahead of every router that demands a session: a client opens this
// from an email and has no password. The token is the only credential, so it is
// long, random, revocable, and tells the holder nothing about anyone else.
export const publicInvoiceRouter = Router();

async function invoiceByToken(token) {
  if (!token || String(token).length < 16) return null;
  const { rows } = await query('SELECT * FROM invoices WHERE public_token = $1', [String(token)]);
  if (!rows[0]) return null;
  // A voided invoice stops being viewable; the link is dead, not wrong.
  if (rows[0].status === 'void') return null;
  return rows[0];
}

const clientIp = (req) => (String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null);

publicInvoiceRouter.get('/public/invoices/:token', async (req, res, next) => {
  try {
    const row = await invoiceByToken(req.params.token);
    if (!row) return res.status(404).json({ error: 'This invoice link is no longer valid' });
    const document = await invoiceDocument(row);
    // `edit` exists for the builder and carries internal ids. A visitor with a
    // link has no business holding them.
    delete document.edit;
    res.json({
      document,
      // What this visitor may do, decided here rather than in the browser.
      actions: {
        sign: !row.signed_at,
        pay: row.status !== 'paid' && row.allow_card_payment === true,
        paymentsLive: paymentsConfigured(),
        demoPayments: !paymentsConfigured() && demoPayments(paymentsConfigured())
      }
    });
  } catch (err) { next(err); }
});

// Acceptance: a typed name, the moment, and the address it came from. Recorded
// once — a signature that could be overwritten would be worth nothing.
publicInvoiceRouter.post('/public/invoices/:token/sign', async (req, res, next) => {
  try {
    const row = await invoiceByToken(req.params.token);
    if (!row) return res.status(404).json({ error: 'This invoice link is no longer valid' });
    const name = String(req.body?.name || '').trim();
    if (name.length < 2) return res.status(400).json({ error: 'Type your full name to accept' });
    if (row.signed_at) return res.status(409).json({ error: 'This invoice has already been accepted' });

    const { rows } = await query(
      `UPDATE invoices SET signed_name = $2, signed_at = now(), signed_ip = $3,
              status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END
        WHERE id = $1 AND signed_at IS NULL
       RETURNING signed_name, signed_at`,
      [row.id, name, clientIp(req)]);
    if (!rows[0]) return res.status(409).json({ error: 'This invoice has already been accepted' });

    await logActivity({ kind: 'invoice', title: 'Invoice accepted', body: `${row.number} signed by ${name}`, tone: 'green' });
    res.json({ ok: true, signature: { name: rows[0].signed_name, at: rows[0].signed_at } });
  } catch (err) { next(err); }
});

publicInvoiceRouter.post('/public/invoices/:token/pay', async (req, res, next) => {
  try {
    const row = await invoiceByToken(req.params.token);
    if (!row) return res.status(404).json({ error: 'This invoice link is no longer valid' });
    if (row.status === 'paid') return res.status(400).json({ error: 'This invoice is already paid' });
    if (row.allow_card_payment !== true) return res.status(403).json({ error: 'Card payment is not enabled on this invoice' });

    const owing = Math.max(0, row.amount_cents - (row.advance_paid_cents || 0));
    if (!paymentsConfigured()) {
      if (!demoPayments(paymentsConfigured())) return res.status(503).json({ error: 'Online payments are not connected yet' });
      return res.json({ demo: true, amount: money(owing, row.currency), message: 'Demo payment — no card is charged and no money moves.' });
    }
    const url = await createInvoiceCheckout({ ...row, amount_cents: owing });
    await logActivity({ kind: 'invoice', title: 'Payment started', body: `${row.number} (public link)`, tone: 'green' });
    res.json({ url });
  } catch (err) { next(err); }
});

publicInvoiceRouter.post('/public/invoices/:token/pay/demo', async (req, res, next) => {
  try {
    if (paymentsConfigured()) return res.status(409).json({ error: 'Stripe is live — use the real checkout' });
    if (!demoPayments(paymentsConfigured())) return res.status(503).json({ error: 'Demo payments are disabled' });
    const row = await invoiceByToken(req.params.token);
    if (!row) return res.status(404).json({ error: 'This invoice link is no longer valid' });
    if (row.allow_card_payment !== true) return res.status(403).json({ error: 'Card payment is not enabled on this invoice' });

    const { rows } = await query(
      `UPDATE invoices SET status = 'paid', paid_at = now(), payment_ref = $2
        WHERE id = $1 AND status <> 'paid' RETURNING number, amount_cents, advance_paid_cents, currency`,
      [row.id, `demo-${Date.now()}`]);
    if (!rows[0]) return res.status(400).json({ error: 'This invoice is already paid' });

    const amount = money(rows[0].amount_cents - (rows[0].advance_paid_cents || 0), rows[0].currency);
    await logActivity({ kind: 'invoice', title: 'Invoice paid (demo)', body: `${rows[0].number} · ${amount} — no card charged`, tone: 'green' });
    res.json({ ok: true, demo: true, number: rows[0].number, amount });
  } catch (err) { next(err); }
});
