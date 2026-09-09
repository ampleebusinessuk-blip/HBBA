import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { logActivity } from '../activity.js';

export const supportRouter = Router();
supportRouter.use(requireAuth);

async function actor(req) {
  const { rows } = await query('SELECT full_name, role FROM users WHERE id = $1', [req.auth.sub]);
  return rows[0] || { full_name: 'User', role: req.auth.role };
}

function ticketDTO(t) {
  return {
    id: t.id, subject: t.subject, status: t.status,
    from: t.from_name || '', last: new Date(t.updated_at).toLocaleString('en-GB'),
    messages: Number(t.message_count) || 0
  };
}

// List tickets: admins see everything, members/sponsors see their own.
supportRouter.get('/support/tickets', async (req, res, next) => {
  try {
    const isAdmin = req.auth.role === 'admin';
    const { rows } = await query(
      `SELECT t.*, u.full_name AS from_name,
              (SELECT count(*) FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
         FROM support_tickets t JOIN users u ON u.id = t.user_id
        ${isAdmin ? '' : 'WHERE t.user_id = $1'}
        ORDER BY t.updated_at DESC`,
      isAdmin ? [] : [req.auth.sub]
    );
    res.json({ tickets: rows.map(ticketDTO) });
  } catch (err) { next(err); }
});

// Open a ticket with its full conversation.
supportRouter.get('/support/tickets/:id', async (req, res, next) => {
  try {
    const t = await query(
      `SELECT t.*, u.full_name AS from_name FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE t.id = $1`,
      [req.params.id]
    );
    const ticket = t.rows[0];
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.auth.role !== 'admin' && ticket.user_id !== req.auth.sub) return res.status(403).json({ error: 'Forbidden' });
    const msgs = await query('SELECT author_name, author_role, body, created_at FROM support_messages WHERE ticket_id = $1 ORDER BY created_at', [req.params.id]);
    res.json({
      ticket: {
        ...ticketDTO({ ...ticket, message_count: msgs.rows.length }),
        messages: msgs.rows.map((m) => ({
          who: m.author_name, role: m.author_role, me: false,
          time: new Date(m.created_at).toLocaleString('en-GB'), text: m.body
        }))
      }
    });
  } catch (err) { next(err); }
});

// Raise a new ticket (opening message included).
supportRouter.post('/support/tickets', async (req, res, next) => {
  try {
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });
    const me = await actor(req);
    const t = await query('INSERT INTO support_tickets (user_id, subject) VALUES ($1, $2) RETURNING id', [req.auth.sub, subject]);
    await query(
      'INSERT INTO support_messages (ticket_id, author_id, author_name, author_role, body) VALUES ($1,$2,$3,$4,$5)',
      [t.rows[0].id, req.auth.sub, me.full_name, me.role, message]
    );
    await logActivity({ kind: 'support', title: 'New support ticket', body: `${subject} — ${me.full_name}`, tone: 'orange' });
    res.status(201).json({ id: t.rows[0].id });
  } catch (err) { next(err); }
});

// Reply to a ticket (owner or admin). Admin replies move it to pending.
supportRouter.post('/support/tickets/:id/messages', async (req, res, next) => {
  try {
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Message required' });
    const t = await query('SELECT user_id FROM support_tickets WHERE id = $1', [req.params.id]);
    if (!t.rows[0]) return res.status(404).json({ error: 'Ticket not found' });
    if (req.auth.role !== 'admin' && t.rows[0].user_id !== req.auth.sub) return res.status(403).json({ error: 'Forbidden' });
    const me = await actor(req);
    await query(
      'INSERT INTO support_messages (ticket_id, author_id, author_name, author_role, body) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, req.auth.sub, me.full_name, me.role, body]
    );
    await query(
      `UPDATE support_tickets SET updated_at = now(),
              status = CASE WHEN $2 = 'admin' THEN 'pending' ELSE 'open' END WHERE id = $1`,
      [req.params.id, me.role]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

// Set ticket status (admin only).
supportRouter.patch('/support/tickets/:id', async (req, res, next) => {
  try {
    if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const status = ['open', 'pending', 'resolved'].includes(req.body?.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: 'Valid status required' });
    const { rowCount } = await query('UPDATE support_tickets SET status = $1, updated_at = now() WHERE id = $2', [status, req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
