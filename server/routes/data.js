import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { ebConfigured, listOrgEvents, eventAttendeeCount, createOrgEvent } from '../eventbrite.js';
import { logActivity } from '../activity.js';

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
    amount_cents: row.amount_cents,
    issued: row.issued_on,
    status: row.status,
    pdf: row.pdf_url || null
  };
}



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
    await logActivity({ kind: 'booking', title: 'Event booked', body: `${ev.rows[0].title} · ${tier}`, tone: 'green' });
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

// Membership summary for the current member, from their own record + tier table.
dataRouter.get('/me/membership', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.tier, u.renews_on, u.created_at, t.price_cents, t.perks
         FROM users u LEFT JOIN membership_tiers t ON t.name = u.tier
        WHERE u.id = $1`, [req.auth.sub]);
    const u = rows[0] || {};
    const tiers = await query('SELECT name, price_cents, perks, color FROM membership_tiers ORDER BY sort');
    res.json({ membership: {
      tier: u.tier || 'Unassigned',
      price: u.price_cents ? `${money(u.price_cents)} / year` : 'No plan yet',
      renews: u.renews_on ? new Date(u.renews_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      since: u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—',
      benefits: u.perks || [],
      options: tiers.rows.map((t) => ({ name: t.name, price: `${money(t.price_cents)}/yr`, perks: t.perks, color: t.color }))
    } });
  } catch (err) { next(err); }
});

// A member asks to move tier. Admins action it from Memberships.
dataRouter.post('/me/membership/upgrade', async (req, res, next) => {
  try {
    const wanted = String(req.body?.tier || '').trim();
    if (!wanted) return res.status(400).json({ error: 'Choose a tier' });
    const { rows: tier } = await query('SELECT name FROM membership_tiers WHERE name = $1', [wanted]);
    if (!tier[0]) return res.status(404).json({ error: 'Unknown tier' });
    const { rows: me } = await query('SELECT full_name, tier FROM users WHERE id = $1', [req.auth.sub]);
    if (me[0]?.tier === wanted) return res.status(409).json({ error: `You are already on ${wanted}` });
    await logActivity({
      kind: 'membership', title: 'Tier change requested',
      body: `${me[0]?.full_name || 'A member'} → ${wanted}`, tone: 'orange'
    });
    await logActivity({
      kind: 'membership', title: 'Tier change requested',
      body: `We have your request to move to ${wanted}. Our team will confirm.`,
      tone: 'blue', role: 'all', userId: req.auth.sub
    });
    res.status(201).json({ ok: true, requested: wanted });
  } catch (err) { next(err); }
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
// `range` (in days) narrows every count to what was created inside the window.
function rangeDays(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 3650 ? Math.round(n) : null;
}

dataRouter.get('/admin/stats', adminOnly, async (req, res, next) => {
  try {
    const days = rangeDays(req.query.range);
    const since = days ? `now() - INTERVAL '${days} days'` : null;
    const win = (col) => (since ? ` AND ${col} >= ${since}` : '');
    const r = await query(`SELECT
      (SELECT count(*) FROM users WHERE role='member'${win('created_at')})  AS members,
      (SELECT count(*) FROM users WHERE role='sponsor'${win('created_at')}) AS sponsors,
      (SELECT count(*) FROM events WHERE true${win('created_at')})          AS events,
      (SELECT count(*) FROM event_bookings WHERE true${win('created_at')})  AS bookings,
      (SELECT coalesce(sum(amount_cents),0) FROM invoices WHERE status='paid'${win('created_at')}) AS revenue_cents`);
    res.json({ stats: r.rows[0], range: days });
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
    await logActivity({
      kind: 'user', title: status === 'suspended' ? 'Account suspended' : 'Account reactivated',
      body: req.params.email, tone: status === 'suspended' ? 'red' : 'green'
    });
    res.json({ ok: true, status });
  } catch (err) { next(err); }
});

// Real aggregates for admin charts.
dataRouter.get('/admin/charts', adminOnly, async (req, res, next) => {
  try {
    const days = rangeDays(req.query.range);
    const win = (col) => (days ? ` AND ${col} >= now() - INTERVAL '${days} days'` : '');
    const [rev, roles, perEvent, monthly] = await Promise.all([
      query(`SELECT status, coalesce(sum(amount_cents),0)::bigint AS total FROM invoices WHERE true${win('created_at')} GROUP BY status`),
      query(`SELECT role, count(*)::int AS count FROM users WHERE true${win('created_at')} GROUP BY role`),
      query(`SELECT e.title, count(b.id)::int AS count
               FROM events e LEFT JOIN event_bookings b ON b.event_id = e.id${days ? ` AND b.created_at >= now() - INTERVAL '${days} days'` : ''}
              GROUP BY e.title ORDER BY count DESC, e.title LIMIT 6`),
      query(`SELECT to_char(m.month, 'Mon YYYY') AS label,
                    (SELECT count(*)::int FROM users u WHERE date_trunc('month', u.created_at) = m.month) AS signups,
                    (SELECT count(*)::int FROM event_bookings b WHERE date_trunc('month', b.created_at) = m.month) AS bookings
               FROM generate_series(date_trunc('month', now()) - INTERVAL '11 months',
                                    date_trunc('month', now()), INTERVAL '1 month') AS m(month)
              ORDER BY m.month`)
    ]);
    res.json({
      revenueByStatus: rev.rows.map((r) => ({ status: r.status, total: Number(r.total) })),
      usersByRole: roles.rows.map((r) => ({ role: r.role, count: r.count })),
      bookingsPerEvent: perEvent.rows.map((r) => ({ title: r.title, count: r.count })),
      activityByMonth: monthly.rows.map((r) => ({ label: r.label, signups: r.signups, bookings: r.bookings }))
    });
  } catch (err) { next(err); }
});

// All users (admin) for the team/roles settings tabs.
dataRouter.get('/admin/users', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT full_name, email, role, status, created_at FROM users ORDER BY created_at');
    res.json({ users: rows.map((u) => ({ name: u.full_name, email: u.email, role: u.role, status: u.status })) });
  } catch (err) { next(err); }
});

// Invite/create a user (admin). Real account, pending until they set a password (email phase).
dataRouter.post('/admin/users', adminOnly, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const name = String(req.body?.full_name || '').trim();
    const role = ['admin', 'member', 'sponsor'].includes(req.body?.role) ? req.body.role : 'member';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email required' });
    if (!name) return res.status(400).json({ error: 'Name required' });
    const { randomBytes } = await import('node:crypto');
    const temp = randomBytes(12).toString('hex');
    const { hashPassword } = await import('../auth.js');
    const hash = await hashPassword(temp);
    try {
      await query(`INSERT INTO users (email, password_hash, role, full_name, status) VALUES ($1,$2,$3,$4,'pending')`,
        [email, hash, role, name]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'A user with that email already exists' });
      throw err;
    }
    await logActivity({ kind: 'user', title: 'User invited', body: `${name} · ${role}`, tone: 'blue' });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

// Remove a user account (never an admin; use suspend for reversible changes).
dataRouter.delete('/admin/users/:email', adminOnly, async (req, res, next) => {
  try {
    const { rows } = await query(
      `DELETE FROM users WHERE lower(email) = lower($1) AND role <> 'admin' RETURNING full_name, email`,
      [req.params.email]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found (admins cannot be removed here)' });
    await logActivity({ kind: 'user', title: 'User removed', body: rows[0].email, tone: 'red' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Move a member onto a membership tier and set the renewal date.
dataRouter.patch('/admin/users/:email/tier', adminOnly, async (req, res, next) => {
  try {
    const tier = String(req.body?.tier || '').trim();
    const { rows: known } = await query('SELECT name FROM membership_tiers WHERE name = $1', [tier]);
    if (!known[0]) return res.status(400).json({ error: 'Unknown tier' });
    const renews = req.body?.renews_on ? String(req.body.renews_on) : null;
    const { rows } = await query(
      `UPDATE users SET tier = $1,
              renews_on = COALESCE($2::date, renews_on, CURRENT_DATE + INTERVAL '1 year')
        WHERE lower(email) = lower($3) RETURNING full_name, email, tier, renews_on`,
      [tier, renews, req.params.email]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    await logActivity({ kind: 'membership', title: 'Membership tier set', body: `${rows[0].full_name} → ${tier}`, tone: 'green' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

// Live connection status of the third-party integrations.
dataRouter.get('/admin/integrations', adminOnly, async (_req, res) => {
  const { ebConfigured } = await import('../eventbrite.js');
  const { paymentsConfigured } = await import('../payments.js');
  res.json({
    eventbrite: ebConfigured(),
    stripe: paymentsConfigured(),
    email: Boolean(process.env.RESEND_API_KEY)
  });
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
    if (checked) await logActivity({ kind: 'ticket', title: 'Attendee checked in', body: 'Ticket desk', tone: 'green' });
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
    await logActivity({ kind: 'deal', title: 'Deal created', body: `${String(title).trim()} · ${money(cents)}`, tone: 'blue' });
    res.status(201).json({ id: rows[0].id });
  } catch (err) { next(err); }
});

dataRouter.patch('/admin/deals/:id', adminOnly, async (req, res, next) => {
  try {
    const stage = ['lead', 'qualified', 'proposal', 'won', 'lost'].includes(req.body?.stage) ? req.body.stage : null;
    if (!stage) return res.status(400).json({ error: 'Valid stage required' });
    const { rows } = await query('UPDATE deals SET stage = $1 WHERE id = $2 RETURNING title, value_cents', [stage, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Deal not found' });
    if (stage === 'won') {
      await logActivity({ kind: 'deal', title: 'Deal won', body: `${rows[0].title} · ${money(rows[0].value_cents)}`, tone: 'green' });
    }
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
    await logActivity({ kind: 'task', title: 'Task created', body: String(title).trim(), tone: 'blue' });
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
    await logActivity({ kind: 'event', title: 'Event created', body: rows[0].title, tone: 'blue' });
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

// Issue a ticket on a member's behalf (admin ticket desk).
dataRouter.post('/admin/tickets', adminOnly, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.event || '').trim();
    const tier = req.body?.tier === 'VIP' ? 'VIP' : 'Standard';
    const buyer = await query('SELECT id, full_name FROM users WHERE lower(email) = $1', [email]);
    if (!buyer.rows[0]) return res.status(404).json({ error: 'No account with that email' });
    const ev = await query('SELECT id, title, capacity FROM events WHERE code = $1 OR title = $1', [code]);
    if (!ev.rows[0]) return res.status(404).json({ error: 'Event not found' });
    const sold = await query('SELECT count(*)::int AS n FROM event_bookings WHERE event_id = $1', [ev.rows[0].id]);
    if (sold.rows[0].n >= ev.rows[0].capacity) return res.status(409).json({ error: 'That event is sold out' });
    const { rows } = await query(
      `INSERT INTO event_bookings (user_id, event_id, tier, status)
       VALUES ($1,$2,$3,'Confirmed')
       ON CONFLICT (user_id, event_id) DO UPDATE SET tier = EXCLUDED.tier, status = 'Confirmed'
       RETURNING id`,
      [buyer.rows[0].id, ev.rows[0].id, tier]);
    await logActivity({ kind: 'ticket', title: 'Ticket issued', body: `${ev.rows[0].title} · ${buyer.rows[0].full_name}`, tone: 'green' });
    await logActivity({
      kind: 'ticket', title: 'You have a new ticket', body: `${ev.rows[0].title} · ${tier}`,
      tone: 'green', role: 'all', userId: buyer.rows[0].id
    });
    res.status(201).json({ ticket: { id: rows[0].id, event: ev.rows[0].title, buyer: buyer.rows[0].full_name, tier } });
  } catch (err) { next(err); }
});

// Refund a ticket: the booking stays on file, marked refunded, and frees capacity.
dataRouter.post('/admin/tickets/:id/refund', adminOnly, async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE event_bookings b SET status = 'Refunded', checked_in = false
         WHERE b.id = $1 AND b.status <> 'Refunded'
       RETURNING b.id, b.user_id, (SELECT title FROM events e WHERE e.id = b.event_id) AS event`,
      [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Ticket not found or already refunded' });
    await logActivity({ kind: 'ticket', title: 'Ticket refunded', body: rows[0].event, tone: 'orange' });
    await logActivity({
      kind: 'ticket', title: 'Your ticket was refunded', body: rows[0].event,
      tone: 'orange', role: 'all', userId: rows[0].user_id
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Update an event (status changes, including cancellation).
dataRouter.patch('/admin/events/:code', adminOnly, async (req, res, next) => {
  try {
    const allowed = ['Confirmed', 'Selling', 'Draft', 'Cancelled'];
    const fields = [];
    const values = [];
    if (req.body?.status !== undefined) {
      if (!allowed.includes(req.body.status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
      values.push(req.body.status); fields.push(`status = $${values.length}`);
    }
    for (const key of ['title', 'date_label', 'time_label', 'city']) {
      if (req.body?.[key] !== undefined) { values.push(String(req.body[key])); fields.push(`${key} = $${values.length}`); }
    }
    if (req.body?.capacity !== undefined) { values.push(Number(req.body.capacity) || 0); fields.push(`capacity = $${values.length}`); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.code);
    const { rows } = await query(
      `UPDATE events SET ${fields.join(', ')} WHERE code = $${values.length} RETURNING code, title, status`, values);
    if (!rows[0]) return res.status(404).json({ error: 'Event not found' });
    if (rows[0].status === 'Cancelled') {
      const attendees = await query(
        'SELECT user_id FROM event_bookings WHERE event_id = (SELECT id FROM events WHERE code = $1)', [req.params.code]);
      for (const a of attendees.rows) {
        await logActivity({
          kind: 'event', title: 'Event cancelled', body: `${rows[0].title} — refunds will follow`,
          tone: 'red', role: 'all', userId: a.user_id
        });
      }
      await logActivity({
        kind: 'event', title: 'Event cancelled',
        body: `${rows[0].title} · ${attendees.rows.length} attendee(s) notified`, tone: 'red'
      });
    }
    res.json({ event: rows[0] });
  } catch (err) { next(err); }
});

// Create a sponsor contract: the sponsor account plus its sponsorship package.
dataRouter.post('/admin/sponsors', adminOnly, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const contact = String(req.body?.contact || '').trim() || name;
    const tier = ['Gold', 'Silver', 'Bronze'].includes(req.body?.tier) ? req.body.tier : 'Gold';
    const amount = Math.max(0, Math.round(Number(req.body?.amount || 0) * 100));
    if (!name) return res.status(400).json({ error: 'Sponsor name required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid contact email required' });

    const existing = await query('SELECT id, role FROM users WHERE lower(email) = $1', [email]);
    let userId = existing.rows[0]?.id;
    if (!userId) {
      const { randomBytes } = await import('node:crypto');
      const { hashPassword } = await import('../auth.js');
      const hash = await hashPassword(randomBytes(12).toString('hex'));
      const created = await query(
        `INSERT INTO users (email, password_hash, role, full_name, org, status)
         VALUES ($1,$2,'sponsor',$3,$4,'pending') RETURNING id`,
        [email, hash, contact, name]);
      userId = created.rows[0].id;
    } else if (existing.rows[0].role !== 'sponsor') {
      return res.status(409).json({ error: 'That email already belongs to a non-sponsor account' });
    }

    await query(
      `INSERT INTO sponsorships (user_id, tier, value_cents, renews, since, inclusions)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id) DO UPDATE SET tier = EXCLUDED.tier, value_cents = EXCLUDED.value_cents, renews = EXCLUDED.renews`,
      [userId, tier, amount, String(req.body?.renewal || '').trim() || null,
        new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        JSON.stringify(req.body?.inclusions || [])]);
    await logActivity({ kind: 'sponsor', title: 'Sponsor onboarded', body: `${name} — ${tier} sponsor`, tone: 'purple' });
    res.status(201).json({ sponsor: { name, tier, amount: money(amount), contact, email } });
  } catch (err) { next(err); }
});
