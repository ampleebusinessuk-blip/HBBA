import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { logActivity, feedFor, markFeedRead } from '../activity.js';
import { sendEmail, sendBulk, layout, deliverySummary, emailConfigured, appUrl } from '../email.js';

export const crmRouter = Router();
crmRouter.use(requireAuth);

const adminOnly = requireRole('admin');
const money = (cents) => '£' + (Number(cents || 0) / 100).toLocaleString('en-GB');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR = (seed) => `https://i.pravatar.cc/96?u=${encodeURIComponent(seed)}`;
const SEGMENTS = ['All members', 'Gold tier', 'Expiring soon', 'Sponsors', 'Contacts'];

function ago(ts) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d`;
}

function contactDTO(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company || '',
    city: row.city || '',
    phone: row.phone || '',
    tier: row.tier,
    status: row.status,
    owner: row.owner || '',
    notes: row.notes || '',
    avatar: row.avatar || AVATAR(row.email),
    presence: row.status === 'Active' ? 'online' : row.status === 'Warm' ? 'away' : row.status === 'Cold' ? 'offline' : 'busy',
    deals: Number(row.deals) || 0,
    last: ago(row.last_activity_at)
  };
}

/* ===================== CONTACTS ===================== */

crmRouter.get('/admin/contacts', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.*, (SELECT count(*) FROM deals d WHERE d.owner = c.name AND d.stage <> 'lost') AS deals
         FROM contacts c ORDER BY c.last_activity_at DESC`);
    const companies = new Set(rows.map((r) => (r.company || '').trim().toLowerCase()).filter(Boolean));
    res.json({
      contacts: rows.map(contactDTO),
      stats: {
        contacts: rows.length,
        companies: companies.size,
        hot: rows.filter((r) => r.status === 'Active' || r.status === 'Warm').length
      }
    });
  } catch (err) { next(err); }
});

crmRouter.post('/admin/contacts', adminOnly, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!name) return res.status(400).json({ error: 'Name required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email required' });
    const tier = ['Gold', 'Silver', 'Bronze'].includes(req.body?.tier) ? req.body.tier : 'Bronze';
    const status = ['Active', 'Warm', 'New', 'Cold'].includes(req.body?.status) ? req.body.status : 'New';
    let rows;
    try {
      ({ rows } = await query(
        `INSERT INTO contacts (name, email, company, city, phone, tier, status, owner, avatar)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [name, email, String(req.body?.company || '').trim() || null, String(req.body?.city || '').trim() || null,
          String(req.body?.phone || '').trim() || null, tier, status,
          String(req.body?.owner || '').trim() || null, AVATAR(email)]));
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'A contact with that email already exists' });
      throw err;
    }
    await logActivity({
      kind: 'contact', title: 'New contact added',
      body: `${name}${rows[0].company ? ` — ${rows[0].company}` : ''}`, tone: 'blue'
    });
    res.status(201).json({ contact: contactDTO({ ...rows[0], deals: 0 }) });
  } catch (err) { next(err); }
});

crmRouter.patch('/admin/contacts/:id', adminOnly, async (req, res, next) => {
  try {
    const fields = [];
    const values = [];
    for (const key of ['name', 'company', 'city', 'phone', 'tier', 'status', 'owner', 'notes']) {
      if (req.body?.[key] !== undefined) { values.push(String(req.body[key])); fields.push(`${key} = $${values.length}`); }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE contacts SET ${fields.join(', ')}, last_activity_at = now() WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact: contactDTO({ ...rows[0], deals: 0 }) });
  } catch (err) { next(err); }
});

crmRouter.delete('/admin/contacts/:id', adminOnly, async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM contacts WHERE id = $1 RETURNING name', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
    await logActivity({ kind: 'contact', title: 'Contact deleted', body: rows[0].name, tone: 'red' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Log an interaction (email/call/meeting) against a contact — real, and it moves "last activity".
crmRouter.post('/admin/contacts/:id/log', adminOnly, async (req, res, next) => {
  try {
    const kind = ['email', 'call', 'meeting'].includes(req.body?.kind) ? req.body.kind : 'email';
    const { rows } = await query(
      'UPDATE contacts SET last_activity_at = now() WHERE id = $1 RETURNING name, email', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
    const label = kind === 'call' ? 'Call logged' : kind === 'meeting' ? 'Meeting logged' : 'Email logged';
    await logActivity({ kind: 'contact', title: label, body: `${rows[0].name} · ${rows[0].email}`, tone: 'green' });
    res.json({ ok: true, logged: kind, contact: rows[0].name });
  } catch (err) { next(err); }
});

/* ===================== MEMBERSHIPS ===================== */

crmRouter.get('/admin/memberships', adminOnly, async (_req, res, next) => {
  try {
    const [tiers, members, renewals, pending] = await Promise.all([
      query('SELECT * FROM membership_tiers ORDER BY sort'),
      query(`SELECT tier, count(*)::int AS n FROM users WHERE role = 'member' GROUP BY tier`),
      query(`SELECT full_name, email, tier, renews_on, nudged_at, (renews_on - CURRENT_DATE) AS days
               FROM users
              WHERE role IN ('member','sponsor') AND renews_on IS NOT NULL
                AND renews_on <= CURRENT_DATE + INTERVAL '60 days'
              ORDER BY renews_on`),
      query(`SELECT count(*)::int AS n FROM users WHERE status = 'pending'`)
    ]);
    const counts = Object.fromEntries(members.rows.map((r) => [r.tier || 'Unassigned', r.n]));
    const totalMembers = members.rows.reduce((sum, r) => sum + r.n, 0);
    res.json({
      tiers: tiers.rows.map((t) => ({
        name: t.name, price: `${money(t.price_cents)}/yr`, price_cents: t.price_cents,
        color: t.color, perks: t.perks, members: counts[t.name] || 0
      })),
      renewals: renewals.rows.map((r) => ({
        name: r.full_name, email: r.email, tier: r.tier || 'Unassigned',
        days: Number(r.days), renews_on: r.renews_on, nudged: Boolean(r.nudged_at)
      })),
      stats: {
        members: totalMembers,
        renewalsDue: renewals.rows.filter((r) => Number(r.days) <= 30).length,
        applications: pending.rows[0].n
      }
    });
  } catch (err) { next(err); }
});

crmRouter.patch('/admin/tiers/:name', adminOnly, async (req, res, next) => {
  try {
    const price = req.body?.price_cents !== undefined ? Math.max(0, Math.round(Number(req.body.price_cents))) : null;
    const perks = Array.isArray(req.body?.perks) ? JSON.stringify(req.body.perks) : null;
    const { rows } = await query(
      `UPDATE membership_tiers
          SET price_cents = COALESCE($1, price_cents), perks = COALESCE($2::jsonb, perks)
        WHERE name = $3 RETURNING *`,
      [price, perks, req.params.name]);
    if (!rows[0]) return res.status(404).json({ error: 'Tier not found' });
    await logActivity({
      kind: 'membership', title: `${rows[0].name} tier updated`,
      body: `Now ${money(rows[0].price_cents)}/yr`, tone: 'orange'
    });
    res.json({ tier: { name: rows[0].name, price_cents: rows[0].price_cents, perks: rows[0].perks, color: rows[0].color } });
  } catch (err) { next(err); }
});

// Nudge one member, or everyone whose membership lapses within 30 days.
crmRouter.post('/admin/renewals/remind', adminOnly, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const { rows } = email
      ? await query('UPDATE users SET nudged_at = now() WHERE email = $1 RETURNING full_name, email, id', [email])
      : await query(`UPDATE users SET nudged_at = now()
                      WHERE role IN ('member','sponsor') AND renews_on IS NOT NULL
                        AND renews_on <= CURRENT_DATE + INTERVAL '60 days'
                      RETURNING full_name, email, id`);
    if (email && !rows[0]) return res.status(404).json({ error: 'Member not found' });
    for (const r of rows) {
      await logActivity({
        kind: 'renewal', title: 'Your membership is due for renewal',
        body: 'Renew from My Membership to keep your benefits active.',
        tone: 'orange', role: 'all', userId: r.id
      });
    }
    const outcome = await sendBulk(rows.map((r) => ({ email: r.email, name: r.full_name })), (person) => ({
      subject: 'Your HBBA Global membership is due for renewal',
      html: layout({
        heading: 'Time to renew',
        body: `<p>Hi ${person.name},</p><p>Your HBBA Global membership renews soon. Open My Membership to confirm your tier or talk to us about changing it.</p>`,
        cta: { url: `${appUrl()}/#myMembership`, label: 'Review my membership' }
      }),
      text: `Your HBBA Global membership renews soon: ${appUrl()}/#myMembership`
    }), 'renewal');
    await logActivity({
      kind: 'renewal', title: 'Renewal reminders sent',
      body: `${rows.length} member(s) nudged, ${deliverySummary(outcome)}`, tone: 'orange'
    });
    res.json({
      reminded: rows.length, delivered: outcome.sent,
      delivery: deliverySummary(outcome), members: rows.map((r) => r.email)
    });
  } catch (err) { next(err); }
});

/* ===================== CAMPAIGNS ===================== */

const AUDIENCE_SQL = {
  'All members': `SELECT email, full_name FROM users WHERE role = 'member' AND status = 'active'`,
  'Gold tier': `SELECT email, full_name FROM users WHERE role = 'member' AND tier = 'Gold'`,
  'Expiring soon': `SELECT email, full_name FROM users WHERE renews_on IS NOT NULL AND renews_on <= CURRENT_DATE + INTERVAL '30 days'`,
  Sponsors: `SELECT email, full_name FROM users WHERE role = 'sponsor'`,
  Contacts: 'SELECT email, name AS full_name FROM contacts'
};

/** Everyone a campaign segment would actually reach. */
async function audienceRecipients(segment) {
  const sql = AUDIENCE_SQL[segment];
  if (!sql) return [];
  const { rows } = await query(sql);
  return rows.map((r) => ({ email: r.email, name: r.full_name }));
}

async function audienceCount(segment) {
  const sql = {
    'All members': `SELECT count(*)::int AS n FROM users WHERE role = 'member' AND status = 'active'`,
    'Gold tier': `SELECT count(*)::int AS n FROM users WHERE role = 'member' AND tier = 'Gold'`,
    'Expiring soon': `SELECT count(*)::int AS n FROM users WHERE renews_on IS NOT NULL AND renews_on <= CURRENT_DATE + INTERVAL '30 days'`,
    Sponsors: `SELECT count(*)::int AS n FROM users WHERE role = 'sponsor'`,
    Contacts: 'SELECT count(*)::int AS n FROM contacts'
  }[segment];
  if (!sql) return 0;
  const { rows } = await query(sql);
  return rows[0].n;
}

crmRouter.get('/admin/campaigns', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM campaigns ORDER BY created_at DESC');
    const audiences = [];
    for (const segment of SEGMENTS) audiences.push({ segment, size: await audienceCount(segment) });
    const sent = rows.filter((c) => c.status === 'Sent' || c.status === 'Active');
    const totalSent = sent.reduce((s, c) => s + c.sent_count, 0);
    const totalOpen = sent.reduce((s, c) => s + c.open_count, 0);
    const totalClick = sent.reduce((s, c) => s + c.click_count, 0);
    res.json({
      campaigns: rows.map((c) => ({
        id: c.id, name: c.name, subject: c.subject || '', segment: c.segment, status: c.status,
        sent: c.sent_count ? String(c.sent_count) : '—',
        open: c.sent_count ? `${Math.round((c.open_count / c.sent_count) * 100)}%` : '—',
        click: c.sent_count ? `${Math.round((c.click_count / c.sent_count) * 100)}%` : '—',
        scheduled_for: c.scheduled_for
      })),
      audiences,
      emailConnected: emailConfigured(),
      stats: {
        campaigns: rows.length,
        openRate: totalSent ? `${Math.round((totalOpen / totalSent) * 100)}%` : '—',
        clicks: totalClick
      }
    });
  } catch (err) { next(err); }
});

crmRouter.post('/admin/campaigns', adminOnly, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Campaign name required' });
    const segment = SEGMENTS.includes(req.body?.segment) ? req.body.segment : 'All members';
    const scheduled = req.body?.scheduled_for ? new Date(req.body.scheduled_for) : null;
    const scheduledOk = scheduled && !Number.isNaN(scheduled.getTime());
    const status = scheduledOk ? 'Scheduled' : 'Draft';
    const { rows } = await query(
      `INSERT INTO campaigns (name, subject, segment, status, scheduled_for)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, String(req.body?.subject || '').trim() || null, segment, status,
        scheduledOk ? scheduled.toISOString() : null]);
    await logActivity({ kind: 'campaign', title: `Campaign ${status.toLowerCase()}`, body: name, tone: 'blue' });
    res.status(201).json({
      campaign: { id: rows[0].id, name: rows[0].name, status: rows[0].status, segment: rows[0].segment }
    });
  } catch (err) { next(err); }
});

// "Send" records the real audience size against the campaign. Actual delivery
// happens through the email provider once one is connected (RESEND_API_KEY).
crmRouter.post('/admin/campaigns/:id/send', adminOnly, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    if (rows[0].status === 'Sent') return res.status(409).json({ error: 'Campaign already sent' });
    const recipients = await audienceRecipients(rows[0].segment);
    if (!recipients.length) return res.status(400).json({ error: 'That audience is empty' });

    const campaign = rows[0];
    const outcome = await sendBulk(recipients, (person) => ({
      subject: campaign.subject || campaign.name,
      html: layout({
        heading: campaign.subject || campaign.name,
        body: `<p>Hi ${person.name || 'there'},</p><p>${campaign.name} from the HBBA Global team.</p><p>Sign in to your portal for the full detail, upcoming events and your membership benefits.</p>`,
        cta: { url: appUrl(), label: 'Open your portal' }
      }),
      text: `${campaign.name} — sign in at ${appUrl()}`
    }), 'campaign');

    const { rows: updated } = await query(
      `UPDATE campaigns SET status = 'Sent', sent_count = $1 WHERE id = $2 RETURNING *`,
      [recipients.length, req.params.id]);
    await logActivity({
      kind: 'campaign', title: 'Campaign sent',
      body: `${updated[0].name} → ${recipients.length} recipient(s), ${deliverySummary(outcome)}`, tone: 'green'
    });
    res.json({ sent: recipients.length, delivered: outcome.sent, delivery: deliverySummary(outcome) });
  } catch (err) { next(err); }
});

/* ===================== NETWORKING ===================== */

crmRouter.get('/networking', async (req, res, next) => {
  try {
    const isAdmin = req.auth.role === 'admin';
    const { rows } = isAdmin
      ? await query('SELECT * FROM intro_requests ORDER BY created_at DESC LIMIT 50')
      : await query('SELECT * FROM intro_requests WHERE requester_id = $1 ORDER BY created_at DESC LIMIT 50', [req.auth.sub]);
    const [people, meetings] = await Promise.all([
      query(`SELECT full_name AS name, role FROM users WHERE status = 'active' ORDER BY created_at LIMIT 7`),
      query(`SELECT count(*)::int AS n FROM intro_requests WHERE status = 'matched'`)
    ]);
    res.json({
      intros: rows.map((r) => ({
        id: r.id, from: r.from_name, to: r.to_name, reason: r.reason || '',
        status: r.status, avatar: AVATAR(r.from_name), when: ago(r.created_at)
      })),
      people: people.rows,
      stats: {
        introductions: rows.length,
        meetings: meetings.rows[0].n,
        matchRate: rows.length ? `${Math.round((meetings.rows[0].n / rows.length) * 100)}%` : '—'
      }
    });
  } catch (err) { next(err); }
});

crmRouter.post('/networking/intros', async (req, res, next) => {
  try {
    const to = String(req.body?.to || '').trim();
    const reason = String(req.body?.reason || '').trim();
    if (!to) return res.status(400).json({ error: 'Who would you like to meet?' });
    const { rows: me } = await query('SELECT full_name FROM users WHERE id = $1', [req.auth.sub]);
    const from = me[0]?.full_name || 'Member';
    const { rows } = await query(
      'INSERT INTO intro_requests (requester_id, from_name, to_name, reason) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.auth.sub, from, to, reason || null]);
    await logActivity({ kind: 'intro', title: 'Intro requested', body: `${from} → ${to}`, tone: 'purple' });
    res.status(201).json({ intro: { id: rows[0].id, from, to: rows[0].to_name, status: rows[0].status } });
  } catch (err) { next(err); }
});

crmRouter.patch('/admin/intros/:id', adminOnly, async (req, res, next) => {
  try {
    const status = ['matched', 'declined', 'pending'].includes(req.body?.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: 'status must be matched, declined or pending' });
    const { rows } = await query('UPDATE intro_requests SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Intro request not found' });
    await logActivity({
      kind: 'intro',
      title: status === 'matched' ? 'Introduction made' : status === 'declined' ? 'Intro declined' : 'Intro reopened',
      body: `${rows[0].from_name} → ${rows[0].to_name}`,
      tone: status === 'matched' ? 'green' : 'orange'
    });
    if (rows[0].requester_id) {
      await logActivity({
        kind: 'intro',
        title: status === 'matched' ? 'Your introduction is confirmed' : 'Intro request update',
        body: rows[0].to_name,
        tone: status === 'matched' ? 'green' : 'orange',
        role: 'all', userId: rows[0].requester_id
      });
    }
    res.json({ intro: { id: rows[0].id, status: rows[0].status } });
  } catch (err) { next(err); }
});

/* ===================== ACTIVITY / NOTIFICATIONS ===================== */

crmRouter.get('/notifications', async (req, res, next) => {
  try {
    const rows = await feedFor(req.auth.sub, req.auth.role, 20);
    res.json({
      notifications: rows.map((r) => ({
        id: r.id, title: r.title, body: r.body || '', time: ago(r.created_at), unread: r.unread, tone: r.tone
      })),
      unread: rows.filter((r) => r.unread).length
    });
  } catch (err) { next(err); }
});

crmRouter.post('/notifications/read', async (req, res, next) => {
  try {
    await markFeedRead(req.auth.sub, req.auth.role);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

crmRouter.get('/admin/activity', adminOnly, async (req, res, next) => {
  try {
    const rows = await feedFor(req.auth.sub, 'admin', 8);
    res.json({ activity: rows.map((r) => ({ title: r.title, body: r.body || '', time: ago(r.created_at), tone: r.tone })) });
  } catch (err) { next(err); }
});

/* ===================== OUTBOX ===================== */

// Everything the app has tried to email, so the demo can show exactly what
// would have gone out (and a live deployment can audit what did).
crmRouter.get('/admin/outbox', adminOnly, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT to_email, subject, kind, status, error, created_at
         FROM email_log ORDER BY created_at DESC LIMIT 40`);
    res.json({
      messages: rows.map((r) => ({
        to: r.to_email, subject: r.subject, kind: r.kind,
        status: r.status, error: r.error || '', time: ago(r.created_at)
      })),
      emailConnected: emailConfigured()
    });
  } catch (err) { next(err); }
});
