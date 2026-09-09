// Transactional email through Resend's REST API (no SDK dependency).
// Dormant unless RESEND_API_KEY is set: every send is still recorded in
// email_log with status 'skipped', so the UI can tell the truth about it.
import { query } from './db.js';
import { demoEmail } from './demo.js';

const RESEND_API = 'https://api.resend.com/emails';

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function emailFrom() {
  return process.env.EMAIL_FROM || 'HBBA Global <onboarding@resend.dev>';
}

export function appUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Branded wrapper so every message looks like it came from the same product. */
export function layout({ heading, body, cta }) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f6fb;padding:28px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;border:1px solid #e4e8f0">
    <div style="font-weight:800;font-size:18px;color:#1f3a73;letter-spacing:-0.02em">HBBA Global</div>
    <h1 style="font-size:20px;color:#101828;margin:18px 0 10px">${esc(heading)}</h1>
    <div style="color:#475467;font-size:14px;line-height:1.6">${body}</div>
    ${cta ? `<p style="margin:24px 0 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#1f3a73;color:#fff;text-decoration:none;padding:11px 18px;border-radius:9px;font-weight:600;font-size:14px">${esc(cta.label)}</a></p>` : ''}
    <p style="color:#98a2b3;font-size:12px;margin-top:26px">HBBA Global · UK Business Network</p>
  </div>
</div>`;
}

async function record({ to, subject, kind, status, providerId = null, error = null }) {
  try {
    await query(
      `INSERT INTO email_log (to_email, subject, kind, provider_id, status, error)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [to, subject, kind, providerId, status, error]);
  } catch {
    // Logging a send must never break the request that triggered it.
  }
}

/**
 * Send one email. Returns { sent, skipped, error } — never throws, so a mail
 * failure cannot roll back the business action that triggered it.
 */
export async function sendEmail({ to, subject, html, text, kind = 'general' }) {
  if (!to || !subject) return { sent: false, skipped: true, error: 'Missing recipient or subject' };
  if (!emailConfigured()) {
    await record({ to, subject, kind, status: 'skipped' });
    return { sent: false, skipped: true };
  }
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [to],
        subject,
        html: html || undefined,
        text: text || undefined
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = data?.message || data?.error?.message || `Resend ${res.status}`;
      await record({ to, subject, kind, status: 'failed', error });
      return { sent: false, skipped: false, error };
    }
    await record({ to, subject, kind, status: 'sent', providerId: data?.id || null });
    return { sent: true, skipped: false, id: data?.id || null };
  } catch (err) {
    await record({ to, subject, kind, status: 'failed', error: err.message });
    return { sent: false, skipped: false, error: err.message };
  }
}

/** Send the same message to many recipients. Returns per-outcome counts. */
export async function sendBulk(recipients, build, kind = 'campaign') {
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const person of recipients) {
    const message = build(person);
    const out = await sendEmail({ ...message, to: person.email, kind });
    if (out.sent) sent++;
    else if (out.skipped) skipped++;
    else failed++;
  }
  return { sent, skipped, failed, total: recipients.length };
}

/** One-line summary for API responses and toasts. */
export function deliverySummary({ sent, skipped, failed, total }) {
  if (!emailConfigured()) {
    return demoEmail(false)
      ? `queued in the demo outbox for ${total} recipient(s) — nothing was delivered`
      : `recorded for ${total} recipient(s) — connect an email provider to deliver`;
  }
  if (failed && sent) return `${sent} delivered, ${failed} failed`;
  if (failed) return `${failed} failed to send`;
  return `${sent} delivered`;
}
