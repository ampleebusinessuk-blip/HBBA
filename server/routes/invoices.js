import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { paymentsConfigured, createInvoiceCheckout } from '../payments.js';

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);
const adminOnly = requireRole('admin');

const money = (cents, currency = 'GBP') =>
  (currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '') + (Number(cents) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const todayISO = () => new Date().toISOString().slice(0, 10);
const dateISO = (v) => (v ? new Date(v).toISOString().slice(0, 10) : null);

// Display status: auto-flag overdue when past due and still unpaid.
function effectiveStatus(row) {
  const due = dateISO(row.due_on);
  if ((row.status === 'due' || row.status === 'sent') && due && due < todayISO()) return 'overdue';
  return row.status;
}

function parseItems(body) {
  let items = Array.isArray(body?.items) ? body.items : [];
  items = items
    .map((it) => ({
      description: String(it.description || '').trim(),
      qty: Math.max(1, Math.round(Number(it.qty) || 1)),
      unit_cents: Math.round(Number(String(it.unit ?? it.unit_cents ?? 0).toString().replace(/[£$,\s]/g, '')) * (it.unit_cents ? 1 : 100))
    }))
    .filter((it) => it.description && it.unit_cents >= 0);
  // Legacy single amount fallback.
  if (!items.length && body?.amount && body?.description) {
    const cents = Math.round(Number(String(body.amount).replace(/[£$,\s]/g, '')) * 100);
    if (cents > 0) items = [{ description: String(body.description).trim(), qty: 1, unit_cents: cents }];
  }
  return items;
}

function totals(items, vatRate) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unit_cents, 0);
  const tax = Math.round((subtotal * Number(vatRate || 0)) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

async function fetchInvoice(number) {
  const inv = await query('SELECT * FROM invoices WHERE number = $1', [number]);
  if (!inv.rows[0]) return null;
  const items = await query('SELECT description, qty, unit_cents FROM invoice_items WHERE invoice_id = $1 ORDER BY sort, description', [inv.rows[0].id]);
  return { ...inv.rows[0], items: items.rows };
}

function invoiceDTO(row, { full = false } = {}) {
  const status = effectiveStatus(row);
  const base = {
    id: row.number, number: row.number, client: row.client_name || null,
    amount: money(row.amount_cents, row.currency), amount_cents: row.amount_cents,
    issued: row.issued_on, due: dateISO(row.due_on), status,
    vat_rate: Number(row.vat_rate) || 0, pdf: row.pdf_url || null
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
      description: it.description, qty: it.qty,
      unit: money(it.unit_cents, row.currency), line: money(it.qty * it.unit_cents, row.currency)
    }))
  };
}

// --- Admin list ---
invoicesRouter.get('/admin/invoices', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT i.*, u.full_name AS client_name
        FROM invoices i LEFT JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC`);
    res.json({ invoices: rows.map((r) => invoiceDTO(r)) });
  } catch (err) { next(err); }
});

// --- Single invoice (admin or the owner) ---
invoicesRouter.get('/invoices/:number', async (req, res, next) => {
  try {
    const row = await fetchInvoice(req.params.number);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    if (req.auth.role !== 'admin' && row.user_id !== req.auth.sub) return res.status(403).json({ error: 'Forbidden' });
    const u = row.user_id ? await query('SELECT full_name, email, org FROM users WHERE id = $1', [row.user_id]) : { rows: [] };
    res.json({ invoice: { ...invoiceDTO({ ...row, client_name: u.rows[0]?.full_name }, { full: true }), client: u.rows[0] || null } });
  } catch (err) { next(err); }
});

// --- Create (admin) ---
invoicesRouter.post('/admin/invoices', adminOnly, async (req, res, next) => {
  try {
    const items = parseItems(req.body);
    if (!items.length) return res.status(400).json({ error: 'Add at least one line item' });
    const vatRate = Number(req.body?.vat_rate) || 0;
    const { subtotal, tax, total } = totals(items, vatRate);

    let userId = null;
    if (req.body?.client && String(req.body.client).includes('@')) {
      const u = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [String(req.body.client).trim()]);
      userId = u.rows[0]?.id || null;
    }
    const number = 'INV-' + Date.now().toString().slice(-8);
    const status = ['draft', 'sent', 'due', 'paid'].includes(req.body?.status) ? req.body.status : 'due';
    const title = req.body?.description || items[0].description;

    const inv = await query(
      `INSERT INTO invoices (number, user_id, description, amount_cents, subtotal_cents, tax_cents, vat_rate, issued_on, due_on, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [number, userId, title, total, subtotal, tax, vatRate, req.body?.issued || todayISO(), req.body?.due_on || null, status, req.body?.notes || null]
    );
    const invId = inv.rows[0].id;
    for (let i = 0; i < items.length; i++) {
      await query('INSERT INTO invoice_items (invoice_id, description, qty, unit_cents, sort) VALUES ($1,$2,$3,$4,$5)',
        [invId, items[i].description, items[i].qty, items[i].unit_cents, i]);
    }
    res.status(201).json({ number });
  } catch (err) { next(err); }
});

// --- Edit / status / void (admin) ---
invoicesRouter.patch('/admin/invoices/:number', adminOnly, async (req, res, next) => {
  try {
    const row = await fetchInvoice(req.params.number);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });

    const fields = [], vals = [];
    if (req.body?.status && ['draft', 'sent', 'due', 'paid', 'overdue', 'void'].includes(req.body.status)) {
      fields.push(`status = $${fields.length + 1}`); vals.push(req.body.status);
    }
    if (req.body?.due_on !== undefined) { fields.push(`due_on = $${fields.length + 1}`); vals.push(req.body.due_on || null); }
    if (req.body?.notes !== undefined) { fields.push(`notes = $${fields.length + 1}`); vals.push(req.body.notes || null); }

    // Optional full re-line: replace items + recompute totals.
    if (Array.isArray(req.body?.items)) {
      const items = parseItems(req.body);
      const vatRate = req.body?.vat_rate !== undefined ? Number(req.body.vat_rate) : Number(row.vat_rate);
      const { subtotal, tax, total } = totals(items, vatRate);
      await query('DELETE FROM invoice_items WHERE invoice_id = $1', [row.id]);
      for (let i = 0; i < items.length; i++) {
        await query('INSERT INTO invoice_items (invoice_id, description, qty, unit_cents, sort) VALUES ($1,$2,$3,$4,$5)',
          [row.id, items[i].description, items[i].qty, items[i].unit_cents, i]);
      }
      fields.push(`subtotal_cents = $${fields.length + 1}`); vals.push(subtotal);
      fields.push(`tax_cents = $${fields.length + 1}`); vals.push(tax);
      fields.push(`amount_cents = $${fields.length + 1}`); vals.push(total);
      fields.push(`vat_rate = $${fields.length + 1}`); vals.push(vatRate);
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(row.id);
    await query(`UPDATE invoices SET ${fields.join(', ')} WHERE id = $${vals.length}`, vals);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

invoicesRouter.delete('/admin/invoices/:number', adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query(`UPDATE invoices SET status = 'void' WHERE number = $1`, [req.params.number]);
    if (!rowCount) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Record that a reminder was sent (real email arrives with the email phase).
invoicesRouter.post('/admin/invoices/:number/remind', adminOnly, async (req, res, next) => {
  try {
    const { rowCount } = await query(
      `UPDATE invoices SET reminder_count = reminder_count + 1, reminded_at = now(),
              status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END
        WHERE number = $1`, [req.params.number]);
    if (!rowCount) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Owner pays an invoice. Stripe-gated: builds a checkout when configured, else 503.
invoicesRouter.post('/invoices/:number/pay', async (req, res, next) => {
  try {
    const row = await fetchInvoice(req.params.number);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    if (req.auth.role !== 'admin' && row.user_id !== req.auth.sub) return res.status(403).json({ error: 'Forbidden' });
    if (row.status === 'paid') return res.status(400).json({ error: 'Invoice already paid' });
    if (!paymentsConfigured()) return res.status(503).json({ error: 'Online payments are not connected yet' });
    const url = await createInvoiceCheckout(row);
    res.json({ url });
  } catch (err) { next(err); }
});
