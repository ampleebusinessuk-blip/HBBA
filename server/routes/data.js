import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const STOCK_AVATAR = 'https://i.pravatar.cc/96?img=12';

export const dataRouter = Router();

function money(cents, currency = 'GBP') {
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '';
  return sym + (cents / 100).toLocaleString('en-GB');
}

function eventDTO(row) {
  return {
    id: row.code,
    title: row.title,
    date: row.date_label,
    time: row.time_label,
    city: row.city,
    capacity: row.capacity,
    attendees: Number(row.attendees) || 0,
    status: row.status,
    img: row.img,
    booked: row.booked || false,
    tier: row.booked_tier || null
  };
}

function invoiceDTO(row) {
  return {
    id: row.number,
    desc: row.description,
    amount: money(row.amount_cents, row.currency),
    issued: row.issued_on,
    status: row.status,
    pdf: row.pdf_url || null
  };
}

/* Membership tiers are static reference data for now (no billing yet). */
const MEMBERSHIP = {
  member: {
    tier: 'Premium', price: '£480 / year', renews: '12 Jan 2027', since: 'Jan 2024',
    benefits: ['All member events', 'Priority event booking', 'Member directory access', 'Quarterly business briefings', '2 guest passes per year']
  }
};

dataRouter.use(requireAuth);

// Events list, annotated with the current user's booking state + attendee counts.
dataRouter.get('/events', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.*,
              (SELECT count(*) FROM event_bookings b WHERE b.event_id = e.id) AS attendees,
              EXISTS (SELECT 1 FROM event_bookings b WHERE b.event_id = e.id AND b.user_id = $1) AS booked,
              (SELECT b.tier FROM event_bookings b WHERE b.event_id = e.id AND b.user_id = $1) AS booked_tier
         FROM events e
        ORDER BY e.created_at`,
      [req.auth.sub]
    );
    res.json({ events: rows.map(eventDTO) });
  } catch (err) { next(err); }
});

// Book the current user onto an event (idempotent per user+event).
dataRouter.post('/events/:code/book', async (req, res, next) => {
  try {
    const tier = req.body?.tier === 'VIP' ? 'VIP' : 'Standard';
    const ev = await query('SELECT id, title FROM events WHERE code = $1', [req.params.code]);
    if (!ev.rows[0]) return res.status(404).json({ error: 'Event not found' });
    await query(
      `INSERT INTO event_bookings (user_id, event_id, tier)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_id) DO UPDATE SET tier = EXCLUDED.tier`,
      [req.auth.sub, ev.rows[0].id, tier]
    );
    res.status(201).json({ ok: true, event: ev.rows[0].title });
  } catch (err) { next(err); }
});

// Cancel the current user's booking for an event.
dataRouter.delete('/events/:code/book', async (req, res, next) => {
  try {
    const ev = await query('SELECT id FROM events WHERE code = $1', [req.params.code]);
    if (!ev.rows[0]) return res.status(404).json({ error: 'Event not found' });
    await query('DELETE FROM event_bookings WHERE user_id = $1 AND event_id = $2', [req.auth.sub, ev.rows[0].id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Current user's bookings ("my tickets").
dataRouter.get('/me/bookings', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.title, e.date_label, b.tier, b.status
         FROM event_bookings b JOIN events e ON e.id = b.event_id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC`,
      [req.auth.sub]
    );
    res.json({ tickets: rows.map((r) => ({ event: r.title, date: r.date_label, tier: r.tier, status: r.status })) });
  } catch (err) { next(err); }
});

// Current user's invoices.
dataRouter.get('/me/invoices', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
      [req.auth.sub]
    );
    res.json({ invoices: rows.map(invoiceDTO) });
  } catch (err) { next(err); }
});

// Membership summary for the current member.
dataRouter.get('/me/membership', (req, res) => {
  res.json({ membership: MEMBERSHIP.member });
});

// --- Sponsor portal ---

// Sponsorship package + brand stats for the current sponsor.
dataRouter.get('/sponsor/overview', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM sponsorships WHERE user_id = $1', [req.auth.sub]);
    const s = rows[0];
    if (!s) return res.json({ overview: null, stats: [] });
    res.json({
      overview: {
        tier: s.tier,
        value: `${money(s.value_cents)} / year`,
        renews: s.renews,
        since: s.since,
        inclusions: s.inclusions
      },
      stats: [
        ['Impressions', Number(s.impressions).toLocaleString('en-GB')],
        ['Logo placements', String(s.placements)],
        ['Leads generated', String(s.leads_count)],
        ['Meetings booked', String(s.meetings)]
      ]
    });
  } catch (err) { next(err); }
});

// Leads attributed to the current sponsor.
dataRouter.get('/sponsor/leads', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT name, company, interest, when_label FROM sponsor_leads WHERE user_id = $1 ORDER BY created_at',
      [req.auth.sub]
    );
    res.json({ leads: rows.map((r) => ({ name: r.name, company: r.company, interest: r.interest, when: r.when_label })) });
  } catch (err) { next(err); }
});

// Events the current sponsor sponsors, with booth + reach.
dataRouter.get('/sponsor/events', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.code, e.title, e.date_label, e.city, e.status, e.img, se.booth, se.reach
         FROM sponsored_events se JOIN events e ON e.id = se.event_id
        WHERE se.user_id = $1
        ORDER BY e.created_at`,
      [req.auth.sub]
    );
    res.json({ events: rows.map((r) => ({
      id: r.code, title: r.title, date: r.date_label, city: r.city,
      status: r.status, img: r.img, booth: r.booth, reach: r.reach
    })) });
  } catch (err) { next(err); }
});

// --- Admin portal (admin only) ---
const adminOnly = requireRole('admin');

// Org-wide metrics for the admin dashboard.
dataRouter.get('/admin/stats', adminOnly, async (_req, res, next) => {
  try {
    const r = await query(`SELECT
      (SELECT count(*) FROM users WHERE role='member')  AS members,
      (SELECT count(*) FROM users WHERE role='sponsor') AS sponsors,
      (SELECT count(*) FROM events)                     AS events,
      (SELECT count(*) FROM event_bookings)             AS bookings,
      (SELECT coalesce(sum(amount_cents),0) FROM invoices WHERE status='paid') AS revenue_cents`);
    res.json({ stats: r.rows[0] });
  } catch (err) { next(err); }
});

// All members (real signed-up users) in the CRM contact shape.
dataRouter.get('/admin/members', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(`SELECT full_name, email, org, status, created_at FROM users WHERE role='member' ORDER BY created_at DESC`);
    res.json({ members: rows.map((u) => ({
      name: u.full_name, email: u.email, company: u.org || '—', city: '—',
      status: u.status === 'active' ? 'Active' : 'New', tier: 'Member', avatar: STOCK_AVATAR,
      presence: 'online', phone: '—', deals: 0, last: new Date(u.created_at).toLocaleDateString('en-GB')
    })) });
  } catch (err) { next(err); }
});

// All sponsors (users + their sponsorship row).
dataRouter.get('/admin/sponsors', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT u.full_name, u.org, s.tier, s.value_cents, s.renews
        FROM users u LEFT JOIN sponsorships s ON s.user_id = u.id
       WHERE u.role='sponsor' ORDER BY u.created_at DESC`);
    res.json({ sponsors: rows.map((r) => ({
      name: r.org || r.full_name, tier: r.tier || 'Gold',
      amount: r.value_cents ? money(r.value_cents) : '—', renewal: r.renews || '—',
      contact: r.full_name, status: 'Active'
    })) });
  } catch (err) { next(err); }
});

// All invoices org-wide, with the client name.
dataRouter.get('/admin/invoices', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT i.number, i.description, i.amount_cents, i.currency, i.issued_on, i.status, u.full_name
        FROM invoices i LEFT JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC`);
    res.json({ invoices: rows.map((r) => ({
      id: r.number, client: r.full_name || '—', amount: money(r.amount_cents, r.currency),
      issued: r.issued_on, due: '—', status: r.status
    })) });
  } catch (err) { next(err); }
});

// Mark an invoice paid (or set any valid status).
dataRouter.patch('/admin/invoices/:number', adminOnly, async (req, res, next) => {
  try {
    const status = ['paid', 'due', 'overdue', 'draft'].includes(req.body?.status) ? req.body.status : 'paid';
    const { rowCount } = await query('UPDATE invoices SET status = $1 WHERE number = $2', [status, req.params.number]);
    if (!rowCount) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ok: true, status });
  } catch (err) { next(err); }
});

// Suspend / reactivate a member or sponsor account.
dataRouter.patch('/admin/users/:email/status', adminOnly, async (req, res, next) => {
  try {
    const status = ['active', 'suspended'].includes(req.body?.status) ? req.body.status : 'suspended';
    const { rowCount } = await query(
      `UPDATE users SET status = $1 WHERE lower(email) = lower($2) AND role <> 'admin'`,
      [status, req.params.email]
    );
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, status });
  } catch (err) { next(err); }
});

// Create an event.
dataRouter.post('/admin/events', adminOnly, async (req, res, next) => {
  try {
    const { title, date_label, time_label, city, capacity } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title required' });
    const code = 'E' + Date.now().toString().slice(-6);
    const { rows } = await query(
      `INSERT INTO events (code, title, date_label, time_label, city, capacity, status)
       VALUES ($1,$2,$3,$4,$5,$6,'Draft') RETURNING code, title`,
      [code, String(title).trim(), date_label || 'TBC', time_label || 'TBC', city || 'TBC', Number(capacity) || 100]
    );
    res.status(201).json({ event: rows[0] });
  } catch (err) { next(err); }
});
