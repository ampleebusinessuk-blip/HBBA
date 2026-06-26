import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

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
