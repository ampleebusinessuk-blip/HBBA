// Campaign delivery service.
//
// Everything that decides *who* receives a campaign and *what state* it ends in
// lives here rather than in an HTTP route, so the admin "Send now" button and
// the cron worker share one implementation and one set of guarantees:
//
//   - only records with explicit marketing consent are ever contacted;
//   - one row per (campaign, email) makes delivery idempotent — a retry sends
//     to failures only, never to an address already delivered;
//   - claiming a campaign is a single conditional UPDATE, so two workers racing
//     for the same campaign produce one set of sends.
import { randomBytes } from 'node:crypto';
import { query as defaultQuery } from './db.js';
import { sendEmail, layout, appUrl as defaultAppUrl, escapeHtml } from './email.js';

export const SEGMENTS = ['All members', 'Gold tier', 'Expiring soon', 'Sponsors', 'Contacts'];

/**
 * Each segment resolves to normalised, consent-qualified addresses. The
 * `marketing_opt_in = true` clause is deliberately repeated in every branch
 * rather than added later: a segment that forgets it would quietly mail people
 * who never agreed to hear from us.
 */
const AUDIENCE_SQL = {
  'All members': `
    SELECT lower(trim(email)) AS email, full_name AS display_name
      FROM users
     WHERE role = 'member' AND status = 'active' AND marketing_opt_in = true`,
  'Gold tier': `
    SELECT lower(trim(email)) AS email, full_name AS display_name
      FROM users
     WHERE role = 'member' AND tier = 'Gold' AND marketing_opt_in = true`,
  'Expiring soon': `
    SELECT lower(trim(email)) AS email, full_name AS display_name
      FROM users
     WHERE renews_on IS NOT NULL AND renews_on <= CURRENT_DATE + INTERVAL '30 days'
       AND marketing_opt_in = true`,
  Sponsors: `
    SELECT lower(trim(email)) AS email, full_name AS display_name
      FROM users
     WHERE role = 'sponsor' AND marketing_opt_in = true`,
  Contacts: `
    SELECT lower(trim(email)) AS email, name AS display_name
      FROM contacts
     WHERE marketing_opt_in = true`
};

/** Total size of a segment, ignoring consent — shown beside the eligible count. */
const SEGMENT_TOTAL_SQL = {
  'All members': `SELECT count(*)::int AS n FROM users WHERE role = 'member' AND status = 'active'`,
  'Gold tier': `SELECT count(*)::int AS n FROM users WHERE role = 'member' AND tier = 'Gold'`,
  'Expiring soon': `SELECT count(*)::int AS n FROM users WHERE renews_on IS NOT NULL AND renews_on <= CURRENT_DATE + INTERVAL '30 days'`,
  Sponsors: `SELECT count(*)::int AS n FROM users WHERE role = 'sponsor'`,
  Contacts: 'SELECT count(*)::int AS n FROM contacts'
};

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

/**
 * Validate admin-authored campaign input.
 * Throws with an operator-readable message; never partially accepts.
 */
export function validateCampaignInput(input = {}, { isProduction = process.env.NODE_ENV === 'production' } = {}) {
  const name = String(input.name || '').trim();
  const subject = String(input.subject || '').trim();
  const bodyText = String(input.body_text ?? input.bodyText ?? '').trim();
  const segment = String(input.segment || '').trim();
  const ctaLabel = String(input.cta_label ?? input.ctaLabel ?? '').trim();
  const ctaUrl = String(input.cta_url ?? input.ctaUrl ?? '').trim();
  const scheduledRaw = String(input.scheduled_for ?? input.scheduledFor ?? '').trim();

  if (!name) throw fail('Campaign name is required');
  if (!subject) throw fail('Subject line is required');
  if (!bodyText) throw fail('Message is required');
  if (!SEGMENTS.includes(segment)) throw fail(`Choose an audience: ${SEGMENTS.join(', ')}`);

  if (Boolean(ctaLabel) !== Boolean(ctaUrl)) {
    throw fail('A call to action needs its label and link together');
  }
  if (ctaUrl) {
    let parsed;
    try {
      parsed = new URL(ctaUrl);
    } catch {
      throw fail('The call-to-action link must be a valid https URL');
    }
    const localHttp = !isProduction && parsed.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) {
      throw fail('The call-to-action link must use https');
    }
  }

  let scheduledFor = null;
  if (scheduledRaw) {
    const when = new Date(scheduledRaw);
    if (Number.isNaN(when.getTime())) throw fail('The send time is not a valid date');
    if (when.getTime() <= Date.now()) throw fail('The send time must be in the future');
    scheduledFor = when;
  }

  return {
    name,
    subject,
    bodyText,
    segment,
    ctaLabel: ctaLabel || null,
    ctaUrl: ctaUrl || null,
    scheduledFor,
    status: scheduledFor ? 'Scheduled' : 'Draft'
  };
}

/** Consent-qualified recipients for a segment, de-duplicated by normalised email. */
export async function campaignAudience(segment, { query = defaultQuery } = {}) {
  const sql = AUDIENCE_SQL[segment];
  if (!sql) return [];
  const { rows } = await query(sql);
  const byEmail = new Map();
  for (const row of rows) {
    const email = String(row.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) continue;
    // First record wins, so a user row's name beats a bare contact row.
    if (!byEmail.has(email)) byEmail.set(email, { email, name: row.display_name || '' });
  }
  return [...byEmail.values()];
}

/** Segment sizes with and without consent, for the audience picker. */
export async function audienceOptions({ query = defaultQuery } = {}) {
  const out = [];
  for (const segment of SEGMENTS) {
    const { rows } = await query(SEGMENT_TOTAL_SQL[segment]);
    const eligible = await campaignAudience(segment, { query });
    out.push({ segment, total: rows[0].n, eligible: eligible.length });
  }
  return out;
}

/** Delivery counts for one campaign, derived from recipient rows. */
export async function campaignSummary(campaignId, { query = defaultQuery } = {}) {
  const { rows } = await query(
    `SELECT count(*)::int AS eligible,
            count(*) FILTER (WHERE delivery_status = 'sent')::int     AS sent,
            count(*) FILTER (WHERE delivery_status = 'failed')::int   AS failed,
            count(*) FILTER (WHERE delivery_status = 'skipped')::int  AS skipped,
            count(*) FILTER (WHERE delivery_status = 'pending')::int  AS pending,
            count(*) FILTER (WHERE first_opened_at IS NOT NULL)::int  AS opened,
            count(*) FILTER (WHERE first_clicked_at IS NOT NULL)::int AS clicked
       FROM campaign_recipients WHERE campaign_id = $1`, [campaignId]);
  return rows[0];
}

/** The email a single recipient receives, with their own tracking tokens. */
function buildMessage(campaign, recipient, base) {
  const openUrl = `${base}/api/campaigns/open/${recipient.public_token}.gif`;
  const clickUrl = campaign.cta_url ? `${base}/api/campaigns/click/${recipient.public_token}` : null;
  const unsubscribeUrl = `${base}/unsubscribe/${recipient.public_token}`;

  // Admins author plain text; it is escaped here so a campaign can never inject
  // markup into the branded template.
  const paragraphs = String(campaign.body_text || '')
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('');

  const html = layout({
    heading: campaign.subject || campaign.name,
    body: `${recipient.display_name ? `<p>Hi ${escapeHtml(recipient.display_name.split(' ')[0])},</p>` : ''}
      ${paragraphs}
      <p style="margin-top:26px;color:#98a2b3;font-size:12px">
        You are receiving this because you opted in to HBBA Global updates.
        <a href="${unsubscribeUrl}" style="color:#98a2b3">Unsubscribe</a>.
      </p>
      <img src="${openUrl}" alt="" width="1" height="1" style="display:none" />`,
    cta: clickUrl ? { url: clickUrl, label: campaign.cta_label } : null
  });

  const text = [
    campaign.body_text,
    campaign.cta_url ? `${campaign.cta_label}: ${clickUrl}` : null,
    `Unsubscribe: ${unsubscribeUrl}`
  ].filter(Boolean).join('\n\n');

  return { subject: campaign.subject || campaign.name, html, text };
}

/**
 * Claim a campaign for delivery.
 *
 * One conditional UPDATE does the whole job: the row is locked for the duration
 * of the statement, and the `status` predicate stops a second worker claiming a
 * campaign that is already `Sending`. No explicit transaction is needed.
 */
async function claimCampaign(campaignId, query) {
  const { rows } = await query(
    `UPDATE campaigns
        SET status = 'Sending', started_at = now(), completed_at = NULL, last_error = NULL
      WHERE id = $1
        AND (status IN ('Draft', 'Partially sent', 'Failed')
             OR (status = 'Scheduled' AND (scheduled_for IS NULL OR scheduled_for <= now())))
      RETURNING *`, [campaignId]);
  return rows[0] || null;
}

/**
 * Deliver (or retry) one campaign.
 *
 * Returns `{ campaignId, claimed, status, eligible, sent, failed, skipped }`.
 * `claimed: false` means another worker holds it or a scheduled campaign is not
 * due yet — not an error.
 */
export async function deliverCampaign(campaignId, deps = {}) {
  const {
    query = defaultQuery,
    send = sendEmail,
    appUrl = defaultAppUrl
  } = deps;

  const campaign = await claimCampaign(campaignId, query);
  if (!campaign) {
    const { rows } = await query('SELECT id, status FROM campaigns WHERE id = $1', [campaignId]);
    if (!rows[0]) throw fail('Campaign not found', 404);
    const summary = await campaignSummary(campaignId, { query });
    return { campaignId, claimed: false, status: rows[0].status, ...summary };
  }

  const previousStatus = campaign.status === 'Sending' ? 'Draft' : campaign.status;
  const audience = await campaignAudience(campaign.segment, { query });

  if (!audience.length) {
    // Nothing to do: hand the campaign back exactly as it was found.
    await query(
      `UPDATE campaigns SET status = $2, started_at = NULL, completed_at = NULL WHERE id = $1`,
      [campaignId, previousStatus === 'Sending' ? 'Draft' : (campaign.scheduled_for ? 'Scheduled' : 'Draft')]);
    return {
      campaignId, claimed: true, empty: true, status: campaign.scheduled_for ? 'Scheduled' : 'Draft',
      eligible: 0, sent: 0, failed: 0, skipped: 0
    };
  }

  // Upsert recipients. An existing row keeps its token and delivery state, so a
  // retry cannot resend or re-tokenise anyone.
  for (const person of audience) {
    await query(
      `INSERT INTO campaign_recipients (campaign_id, email, display_name, public_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (campaign_id, email)
       DO UPDATE SET display_name = COALESCE(EXCLUDED.display_name, campaign_recipients.display_name),
                     updated_at = now()`,
      [campaignId, person.email, person.name || null, randomBytes(32).toString('base64url')]);
  }

  const { rows: pending } = await query(
    `SELECT id, email, display_name, public_token
       FROM campaign_recipients
      WHERE campaign_id = $1 AND delivery_status <> 'sent'
      ORDER BY created_at`, [campaignId]);

  const base = String(appUrl()).replace(/\/$/, '');
  let lastError = null;

  for (const recipient of pending) {
    const message = buildMessage(campaign, recipient, base);
    let outcome;
    try {
      outcome = await send({ ...message, to: recipient.email, kind: 'campaign' });
    } catch (err) {
      outcome = { sent: false, skipped: false, error: err.message };
    }

    const status = outcome.sent ? 'sent' : outcome.skipped ? 'skipped' : 'failed';
    if (status === 'failed') lastError = outcome.error || 'Delivery failed';
    if (status === 'skipped') lastError = lastError || 'No email provider is connected';

    await query(
      `UPDATE campaign_recipients
          SET delivery_status = $2, provider_id = $3, error = $4,
              sent_at = CASE WHEN $2 = 'sent' THEN now() ELSE sent_at END,
              updated_at = now()
        WHERE id = $1`,
      [recipient.id, status, outcome.id || null, status === 'sent' ? null : (outcome.error || null)]);
  }

  const summary = await campaignSummary(campaignId, { query });
  const status = summary.sent && !summary.failed && !summary.skipped && !summary.pending
    ? 'Sent'
    : summary.sent ? 'Partially sent' : 'Failed';

  await query(
    `UPDATE campaigns
        SET status = $2, sent_count = $3, failed_count = $4, completed_at = now(), last_error = $5
      WHERE id = $1`,
    [campaignId, status, summary.sent, summary.failed + summary.skipped, status === 'Sent' ? null : lastError]);

  return { campaignId, claimed: true, status, ...summary };
}

/** Campaigns whose scheduled time has arrived, oldest first. */
export async function dueCampaigns(limit = 5, { query = defaultQuery } = {}) {
  const { rows } = await query(
    `SELECT id FROM campaigns
      WHERE status = 'Scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= now()
      ORDER BY scheduled_for
      LIMIT $1`, [limit]);
  return rows.map((r) => r.id);
}
