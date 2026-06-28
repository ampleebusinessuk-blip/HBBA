import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { ebConfigured, listOrgEvents, eventAttendeeCount, createOrgEvent } from '../eventbrite.js';

const STOCK_AVATAR = 'https://i.pravatar.cc/96?img=12';

export const dataRouter = Router();

function money(cents, currency = 'GBP') {
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '';
  return sym + (cents / 100).toLocaleString('en-GB');
}

function eventDTO(row) {
  const fromEb = row.source === 'eventbrite';
  return {
    id: row.code,
    title: row.title,
    date: row.date_label,
    time: row.time_label,
    city: row.city,
    capacity: row.capacity,
    attendees: fromEb ? (Number(row.eb_attendees) || 0) : (Number(row.attendees) || 0),
    status: row.status,
    img: row.img,
    booked: row.booked || false,
    tier: row.booked_tier || null,
    source: row.source || 'local',
    url: row.url || null
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

// Update the current user's own profile (name / org).
dataRouter.patch('/me/profile', async (req, res, next) => {
  try {
    const { full_name, org } = req.body || {};
    if (!full_name || !String(full_name).trim()) return res.status(400).json({ error: 'Name required' });
    const { rows } = await query(
      `UPDATE users SET full_name = $1, org = $2 WHERE id = $3
       RETURNING id, email, role, full_name, org, status`,
      [String(full_name).trim(), org ? String(org).trim() : null, req.auth.sub]
    );
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
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
      'SELECT id, name, company, interest, when_label FROM sponsor_leads WHERE user_id = $1 ORDER BY created_at',
      [req.auth.sub]
    );
    res.json({ leads: rows.map((r) => ({ id: r.id, name: r.name, company: r.company, interest: r.interest, when: r.when_label })) });
  } catch (err) { next(err); }
});

// Request an intro to a lead (records the action by removing it from the open list).
dataRouter.post('/sponsor/leads/:id/contact', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM sponsor_leads WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.sub]);
    if (!rowCount) return res.status(404).json({ error: 'Lead not found' });
    res.json({ ok: true });
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

// Real aggregates for admin charts.
dataRouter.get('/admin/charts', adminOnly, async (_req, res, next) => {
  try {
    const [rev, roles, perEvent] = await Promise.all([
      query(`SELECT status, coalesce(sum(amount_cents),0)::bigint AS total FROM invoices GROUP BY status`),
      query(`SELECT role, count(*)::int AS count FROM users GROUP BY role`),
      query(`SELECT e.title, count(b.id)::int AS count
               FROM events e LEFT JOIN event_bookings b ON b.event_id = e.id
              GROUP BY e.title ORDER BY count DESC, e.title LIMIT 6`)
    ]);
    res.json({
      revenueByStatus: rev.rows.map((r) => ({ status: r.status, total: Number(r.total) })),
      usersByRole: roles.rows.map((r) => ({ role: r.role, count: r.count })),
      bookingsPerEvent: perEvent.rows.map((r) => ({ title: r.title, count: r.count }))
    });
  } catch (err) { next(err); }
});

// Ticket desk (admin): every event booking with check-in state.
dataRouter.get('/admin/tickets', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT b.id, e.title AS event, u.full_name AS buyer, b.tier, b.status, b.checked_in
         FROM event_bookings b JOIN events e ON e.id = b.event_id JOIN users u ON u.id = b.user_id
        ORDER BY b.created_at DESC`);
    res.json({ tickets: rows.map((r) => ({
      id: r.id, event: r.event, buyer: r.buyer, tier: r.tier,
      status: r.status, checked_in: r.checked_in
    })) });
  } catch (err) { next(err); }
});

dataRouter.patch('/admin/tickets/:id/checkin', adminOnly, async (req, res, next) => {
  try {
    const checked = req.body?.checked_in !== false;
    const { rowCount } = await query(
      'UPDATE event_bookings SET checked_in = $1, checked_in_at = CASE WHEN $1 THEN now() ELSE NULL END WHERE id = $2',
      [checked, req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ok: true, checked_in: checked });
  } catch (err) { next(err); }
});

// CRM deals pipeline (admin), grouped into stage columns.
const DEAL_STAGES = [['lead', 'Lead'], ['qualified', 'Qualified'], ['proposal', 'Proposal'], ['won', 'Won']];
dataRouter.get('/admin/deals', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT id, title, value_cents, owner, tier, stage FROM deals ORDER BY created_at');
    const stages = DEAL_STAGES.map(([key, name]) => {
      const cards = rows.filter((r) => r.stage === key);
      const total = cards.reduce((s, c) => s + c.value_cents, 0);
      return {
        key, name, total: money(total),
        cards: cards.map((c) => ({ id: c.id, title: c.title, value: money(c.value_cents), owner: c.owner, tier: c.tier }))
      };
    });
    res.json({ stages });
  } catch (err) { next(err); }
});

dataRouter.post('/admin/deals', adminOnly, async (req, res, next) => {
  try {
    const { title, value, owner, tier, stage } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Deal title required' });
    const cents = Math.round(Number(String(value || 0).replace(/[£$,\s]/g, '')) * 100);
    const st = ['lead', 'qualified', 'proposal', 'won', 'lost'].includes(stage) ? stage : 'lead';
    const { rows } = await query('INSERT INTO deals (title, value_cents, owner, tier, stage) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [String(title).trim(), cents, owner || null, tier || 'Silver', st]);
    res.status(201).json({ id: rows[0].id });
  } catch (err) { next(err); }
});

dataRouter.patch('/admin/deals/:id', adminOnly, async (req, res, next) => {
  try {
    const stage = ['lead', 'qualified', 'proposal', 'won', 'lost'].includes(req.body?.stage) ? req.body.stage : null;
    if (!stage) return res.status(400).json({ error: 'Valid stage required' });
    const { rowCount } = await query('UPDATE deals SET stage = $1 WHERE id = $2', [stage, req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Deal not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Tasks board (admin) — grouped by column.
dataRouter.get('/admin/tasks', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT id, title, assignee, priority, status, due FROM tasks ORDER BY created_at');
    const board = { todo: [], doing: [], done: [] };
    for (const t of rows) (board[t.status] || board.todo).push(t);
    res.json({ board });
  } catch (err) { next(err); }
});

dataRouter.post('/admin/tasks', adminOnly, async (req, res, next) => {
  try {
    const { title, assignee, priority, due } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Task title required' });
    const p = ['high', 'med', 'low'].includes(priority) ? priority : 'med';
    const { rows } = await query(
      `INSERT INTO tasks (title, assignee, priority, status, due) VALUES ($1,$2,$3,'todo',$4) RETURNING id`,
      [String(title).trim(), assignee || null, p, due || null]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) { next(err); }
});

dataRouter.patch('/admin/tasks/:id', adminOnly, async (req, res, next) => {
  try {
    const status = ['todo', 'doing', 'done'].includes(req.body?.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: 'Valid status required' });
    const { rowCount } = await query('UPDATE tasks SET status = $1 WHERE id = $2', [status, req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Task not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Create an event.
dataRouter.post('/admin/events', adminOnly, async (req, res, next) => {
  try {
    const { title, date_label, time_label, city, capacity } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title required' });
    const code = 'E' + Date.now().toString().slice(-6);

    // Two-way: push to Eventbrite if connected (best-effort; never blocks local create).
    let ebId = null, url = null;
    if (ebConfigured() && req.body?.push_eventbrite) {
      try {
        const start = req.body?.start_utc, end = req.body?.end_utc;
        if (start && end) {
          const r = await createOrgEvent({ title: String(title).trim(), startUtc: start, endUtc: end });
          ebId = r.id; url = r.url;
        }
      } catch (err) {
        return res.status(502).json({ error: `Created locally failed to push: ${err.message}` });
      }
    }

    const { rows } = await query(
      `INSERT INTO events (code, title, date_label, time_label, city, capacity, status, eventbrite_id, url, source)
       VALUES ($1,$2,$3,$4,$5,$6,'Draft',$7,$8,$9) RETURNING code, title`,
      [code, String(title).trim(), date_label || 'TBC', time_label || 'TBC', city || 'TBC',
       Number(capacity) || 100, ebId, url, ebId ? 'eventbrite' : 'local']
    );
    res.status(201).json({ event: rows[0], pushed: Boolean(ebId) });
  } catch (err) { next(err); }
});

// Eventbrite connection status.
dataRouter.get('/admin/eventbrite/status', adminOnly, (_req, res) => {
  res.json({ configured: ebConfigured() });
});

// Pull org events from Eventbrite and upsert them (+ refresh attendee counts).
dataRouter.post('/admin/eventbrite/sync', adminOnly, async (_req, res, next) => {
  try {
    if (!ebConfigured()) return res.status(400).json({ error: 'Eventbrite not connected. Add EVENTBRITE_TOKEN and EVENTBRITE_ORG_ID.' });
    const events = await listOrgEvents();
    let imported = 0;
    for (const e of events) {
      let count = 0;
      try { count = await eventAttendeeCount(e.eventbrite_id); } catch { /* ignore per-event count failure */ }
      const code = 'EB-' + e.eventbrite_id;
      await query(
        `INSERT INTO events (code, title, date_label, time_label, city, capacity, img, status, eventbrite_id, url, source, eb_attendees)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'eventbrite',$11)
         ON CONFLICT (eventbrite_id) DO UPDATE SET
           title=EXCLUDED.title, date_label=EXCLUDED.date_label, time_label=EXCLUDED.time_label,
           city=EXCLUDED.city, capacity=EXCLUDED.capacity, img=EXCLUDED.img, status=EXCLUDED.status,
           url=EXCLUDED.url, eb_attendees=EXCLUDED.eb_attendees`,
        [code, e.title, e.date_label, e.time_label, e.city, e.capacity, e.img, e.status, e.eventbrite_id, e.url, count]
      );
      imported++;
    }
    res.json({ ok: true, imported });
  } catch (err) { next(err); }
});
