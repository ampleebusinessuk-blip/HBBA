// Client records: the companies you invoice, whether or not they hold a portal
// account. An invoice addressed to a client prints that client's own name, VAT
// number and address rather than guessing from a user row.
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../permissions.js';
import { logActivity } from '../activity.js';

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

const canBill = requirePermission('invoices.manage', 'crm.manage');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientDTO(row) {
  return {
    id: row.id,
    name: row.name,
    contact_name: row.contact_name || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    postcode: row.postcode || '',
    country: row.country || '',
    registration_no: row.registration_no || '',
    vat_no: row.vat_no || '',
    notes: row.notes || '',
    user_id: row.user_id || null,
    invoices: Number(row.invoice_count) || 0,
    billed_cents: Number(row.billed_cents) || 0
  };
}

const FIELDS = ['name', 'contact_name', 'email', 'phone', 'address', 'city',
  'postcode', 'country', 'registration_no', 'vat_no', 'notes'];

clientsRouter.get('/admin/clients', canBill, async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT c.*,
             count(i.id)::int AS invoice_count,
             coalesce(sum(i.amount_cents) FILTER (WHERE i.status = 'paid'), 0)::bigint AS billed_cents
        FROM clients c
        LEFT JOIN invoices i ON i.client_id = c.id
       GROUP BY c.id
       ORDER BY lower(c.name)`);
    res.json({ clients: rows.map(clientDTO) });
  } catch (err) { next(err); }
});

clientsRouter.post('/admin/clients', canBill, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Client name required' });
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'That email is not valid' });

    const values = FIELDS.map((f) => (f === 'email' ? email || null : String(req.body?.[f] || '').trim() || null));
    values[0] = name;

    // Linking to a portal account is optional and only ever by exact email.
    let userId = null;
    if (email) {
      const { rows: user } = await query('SELECT id FROM users WHERE lower(email) = $1', [email]);
      userId = user[0]?.id || null;
    }

    const { rows } = await query(
      `INSERT INTO clients (${FIELDS.join(', ')}, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [...values, userId]);
    await logActivity({ kind: 'client', title: 'Client added', body: name, tone: 'blue' });
    res.status(201).json({ client: clientDTO({ ...rows[0], invoice_count: 0, billed_cents: 0 }) });
  } catch (err) { next(err); }
});

clientsRouter.patch('/admin/clients/:id', canBill, async (req, res, next) => {
  try {
    const sets = [];
    const values = [];
    for (const field of FIELDS) {
      if (req.body?.[field] === undefined) continue;
      const value = String(req.body[field]).trim();
      if (field === 'name' && !value) return res.status(400).json({ error: 'Client name required' });
      if (field === 'email' && value && !EMAIL_RE.test(value)) return res.status(400).json({ error: 'That email is not valid' });
      values.push(value || null);
      sets.push(`${field} = $${values.length}`);
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE clients SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    res.json({ client: clientDTO({ ...rows[0], invoice_count: 0, billed_cents: 0 }) });
  } catch (err) { next(err); }
});

clientsRouter.delete('/admin/clients/:id', canBill, async (req, res, next) => {
  try {
    const { rows: used } = await query(
      'SELECT count(*)::int AS n FROM invoices WHERE client_id = $1', [req.params.id]);
    if (used[0].n) {
      // Deleting would orphan a billing record; say so rather than cascading.
      return res.status(409).json({ error: `That client has ${used[0].n} invoice(s). Remove or reassign them first.` });
    }
    const { rows } = await query('DELETE FROM clients WHERE id = $1 RETURNING name', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });
    await logActivity({ kind: 'client', title: 'Client removed', body: rows[0].name, tone: 'orange' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
