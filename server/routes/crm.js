import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { logActivity, feedFor, markFeedRead } from '../activity.js';
import { requirePermission } from '../permissions.js';
import { sendEmail, sendBulk, layout, deliverySummary, emailConfigured, appUrl } from '../email.js';
import {
  validateCampaignInput, audienceOptions, campaignSummary, deliverCampaign
} from '../campaigns.js';

export const crmRouter = Router();
crmRouter.use(requireAuth);

const adminOnly = requireRole('admin');
const money = (cents) => '£' + (Number(cents || 0) / 100).toLocaleString('en-GB');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

/**
 * Marketing consent is only ever changed by an explicit boolean. An absent
 * field means "leave it alone", so an unrelated edit can never silently opt
 * somebody in, and the matching timestamp is stamped on each transition.
 */
function consentUpdate(value, values) {
  if (value !== true && value !== false) return null;
  values.push(value);
  const n = values.length;
  return `marketing_opt_in = $${n}, `
    + `marketing_opted_in_at = CASE WHEN $${n} THEN now() ELSE marketing_opted_in_at END, `
    + `marketing_opted_out_at = CASE WHEN $${n} THEN marketing_opted_out_at ELSE now() END`;
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
    // A real picture if one was set, otherwise nothing — the interface draws
    // their initials. A stock photograph of a stranger is worse than no photo,
    // and generating one offsite would hand a third party every contact's email.
    avatar: row.avatar || null,
    presence: row.status === 'Active' ? 'online' : row.status === 'Warm' ? 'away' : row.status === 'Cold' ? 'offline' : 'busy',
    deals: Number(row.deals) || 0,
    marketing_opt_in: row.marketing_opt_in === true,
    last: ago(row.last_activity_at)
  };
}

/* ===================== CONTACTS ===================== */

crmRouter.get('/admin/contacts', requirePermission('crm.manage'), async (_req, res, next) => {
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

crmRouter.post('/admin/contacts', requirePermission('crm.manage'), async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!name) return res.status(400).json({ error: 'Name required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email required' });
    const tier = ['Gold', 'Silver', 'Bronze'].includes(req.body?.tier) ? req.body.tier : 'Bronze';
    const status = ['Active', 'Warm', 'New', 'Cold'].includes(req.body?.status) ? req.body.status : 'New';
    let rows;
    try {
      const optIn = req.body?.marketing_opt_in === true;
      ({ rows } = await query(
        `INSERT INTO contacts (name, email, company, city, phone, tier, status, owner, avatar,
                               marketing_opt_in, marketing_opted_in_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CASE WHEN $10 THEN now() ELSE NULL END) RETURNING *`,
        [name, email, String(req.body?.company || '').trim() || null, String(req.body?.city || '').trim() || null,
          String(req.body?.phone || '').trim() || null, tier, status,
          // No picture unless somebody supplies one; the interface draws initials.
          String(req.body?.owner || '').trim() || null, String(req.body?.avatar || '').trim() || null, optIn]));
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

crmRouter.patch('/admin/contacts/:id', requirePermission('crm.manage'), async (req, res, next) => {
  try {
    const fields = [];
    const values = [];
    for (const key of ['name', 'company', 'city', 'phone', 'tier', 'status', 'owner', 'notes']) {
      if (req.body?.[key] !== undefined) { values.push(String(req.body[key])); fields.push(`${key} = $${values.length}`); }
    }
    const consent = consentUpdate(req.body?.marketing_opt_in, values);
    if (consent) fields.push(consent);
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE contacts SET ${fields.join(', ')}, last_activity_at = now() WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact: contactDTO({ ...rows[0], deals: 0 }) });
  } catch (err) { next(err); }
});

crmRouter.delete('/admin/contacts/:id', requirePermission('crm.manage'), async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM contacts WHERE id = $1 RETURNING name', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
    await logActivity({ kind: 'contact', title: 'Contact deleted', body: rows[0].name, tone: 'red' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Log an interaction (email/call/meeting) against a contact — real, and it moves "last activity".
crmRouter.post('/admin/contacts/:id/log', requirePermission('crm.manage'), async (req, res, next) => {
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

crmRouter.get('/admin/memberships', requirePermission('memberships.manage'), async (_req, res, next) => {
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

crmRouter.patch('/admin/tiers/:name', requirePermission('memberships.manage'), async (req, res, next) => {
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
crmRouter.post('/admin/renewals/remind', requirePermission('memberships.manage'), async (req, res, next) => {
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

crmRouter.get('/admin/campaigns', requirePermission('campaigns.manage'), async (_req, res, next) => {
  try {
    // Delivery figures come from recipient rows, never from audience size.
    const { rows } = await query(`
      SELECT c.*,
             count(r.id) FILTER (WHERE r.delivery_status = 'sent')::int     AS delivered,
             count(r.id) FILTER (WHERE r.delivery_status = 'failed')::int   AS failed,
             count(r.id) FILTER (WHERE r.delivery_status = 'skipped')::int  AS skipped,
             count(r.id)::int                                               AS recipients,
             count(r.id) FILTER (WHERE r.first_opened_at IS NOT NULL)::int  AS opened,
             count(r.id) FILTER (WHERE r.first_clicked_at IS NOT NULL)::int AS clicked
        FROM campaigns c
        LEFT JOIN campaign_recipients r ON r.campaign_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`);

    const audiences = await audienceOptions({ query });
    const totals = rows.reduce((acc, c) => ({
      delivered: acc.delivered + c.delivered,
      opened: acc.opened + c.opened,
      clicked: acc.clicked + c.clicked
    }), { delivered: 0, opened: 0, clicked: 0 });

    res.json({
      campaigns: rows.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject || '',
        body_text: c.body_text || '',
        cta_label: c.cta_label || '',
        cta_url: c.cta_url || '',
        segment: c.segment,
        status: c.status,
        recipients: c.recipients,
        delivered: c.delivered,
        failed: c.failed + c.skipped,
        opened: c.opened,
        clicked: c.clicked,
        openRate: c.delivered ? `${Math.round((c.opened / c.delivered) * 100)}%` : '—',
        clickRate: c.delivered ? `${Math.round((c.clicked / c.delivered) * 100)}%` : '—',
        scheduled_for: c.scheduled_for,
        completed_at: c.completed_at,
        last_error: c.last_error || ''
      })),
      audiences,
      emailConnected: emailConfigured(),
      stats: {
        campaigns: rows.length,
        delivered: totals.delivered,
        openRate: totals.delivered ? `${Math.round((totals.opened / totals.delivered) * 100)}%` : '—',
        clicks: totals.clicked
      }
    });
  } catch (err) { next(err); }
});

crmRouter.post('/admin/campaigns', requirePermission('campaigns.manage'), async (req, res, next) => {
  try {
    let input;
    try {
      input = validateCampaignInput(req.body, {});
    } catch (err) {
      // Validation runs before any INSERT, so a rejected campaign leaves nothing behind.
      return res.status(err.status || 400).json({ error: err.message });
    }

    const { rows } = await query(
      `INSERT INTO campaigns (name, subject, body_text, segment, status, cta_label, cta_url, scheduled_for)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [input.name, input.subject, input.bodyText, input.segment, input.status,
        input.ctaLabel, input.ctaUrl, input.scheduledFor ? input.scheduledFor.toISOString() : null]);

    await logActivity({
      kind: 'campaign', title: `Campaign ${input.status.toLowerCase()}`, body: input.name, tone: 'blue'
    });
    res.status(201).json({
      campaign: {
        id: rows[0].id, name: rows[0].name, status: rows[0].status,
        segment: rows[0].segment, scheduled_for: rows[0].scheduled_for
      }
    });
  } catch (err) { next(err); }
});

/**
 * Manual send and retry are the same operation: hand the campaign to the
 * delivery service, which decides what is still outstanding. The response is
 * the real outcome, so a campaign that delivered nothing is never called sent.
 */
async function runCampaign(req, res, next) {
  try {
    const { rows } = await query('SELECT id, status FROM campaigns WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    if (rows[0].status === 'Sending') return res.status(409).json({ error: 'That campaign is already sending' });
    if (rows[0].status === 'Sent') return res.status(409).json({ error: 'That campaign has already been sent' });

    const result = await deliverCampaign(req.params.id, { query });
    if (result.empty) {
      return res.status(400).json({ error: 'No one in that audience has opted in to marketing email' });
    }
    if (!result.claimed) {
      return res.status(409).json({ error: 'That campaign is already sending' });
    }

    await logActivity({
      kind: 'campaign',
      title: result.status === 'Sent' ? 'Campaign sent' : `Campaign ${result.status.toLowerCase()}`,
      body: `${result.sent} delivered, ${result.failed + result.skipped} undelivered`,
      tone: result.status === 'Sent' ? 'green' : result.status === 'Failed' ? 'red' : 'orange'
    });

    res.json({
      status: result.status,
      eligible: result.eligible,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      emailConnected: emailConfigured()
    });
  } catch (err) { next(err); }
}

crmRouter.post('/admin/campaigns/:id/send', requirePermission('campaigns.manage'), runCampaign);
crmRouter.post('/admin/campaigns/:id/retry', requirePermission('campaigns.manage'), runCampaign);

crmRouter.get('/admin/campaigns/:id', requirePermission('campaigns.manage'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    const summary = await campaignSummary(req.params.id, { query });
    res.json({ campaign: rows[0], summary });
  } catch (err) { next(err); }
});

/* ===================== NETWORKING ===================== */

crmRouter.get('/networking', async (req, res, next) => {
  try {
    const isAdmin = req.auth.role === 'admin';
    const { rows } = isAdmin
      ? await query(
        `SELECT i.*, u.avatar_data AS requester_avatar
           FROM intro_requests i LEFT JOIN users u ON u.id = i.requester_id
          ORDER BY i.created_at DESC LIMIT 50`)
      : await query(
        `SELECT i.*, u.avatar_data AS requester_avatar
           FROM intro_requests i LEFT JOIN users u ON u.id = i.requester_id
          WHERE i.requester_id = $1 ORDER BY i.created_at DESC LIMIT 50`, [req.auth.sub]);
    const [people, meetings] = await Promise.all([
      query(`SELECT full_name AS name, role, avatar_data AS avatar FROM users WHERE status = 'active' ORDER BY created_at LIMIT 7`),
      query(`SELECT count(*)::int AS n FROM intro_requests WHERE status = 'matched'`)
    ]);
    res.json({
      intros: rows.map((r) => ({
        id: r.id, from: r.from_name, to: r.to_name, reason: r.reason || '',
        status: r.status, avatar: r.requester_avatar || null, when: ago(r.created_at)
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

crmRouter.patch('/admin/intros/:id', requirePermission('networking.manage'), async (req, res, next) => {
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

crmRouter.get('/admin/activity', requirePermission('reports.view'), async (req, res, next) => {
  try {
    const rows = await feedFor(req.auth.sub, 'admin', 8);
    res.json({ activity: rows.map((r) => ({ title: r.title, body: r.body || '', time: ago(r.created_at), tone: r.tone })) });
  } catch (err) { next(err); }
});

/* ===================== OUTBOX ===================== */

// Everything the app has tried to email, so the demo can show exactly what
// would have gone out (and a live deployment can audit what did).
crmRouter.get('/admin/outbox', requirePermission('campaigns.manage'), async (_req, res, next) => {
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
