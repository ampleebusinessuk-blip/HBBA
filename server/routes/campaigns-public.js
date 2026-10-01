// Public campaign endpoints: open tracking, click tracking and unsubscribe.
//
// These are the only campaign routes reachable without a session, because they
// are opened from an email client. Three rules hold throughout:
//
//   1. The token is opaque. It carries no address and no campaign reference, so
//      possessing one reveals nothing and guessing one is not feasible.
//   2. A destination is never taken from the request. The click endpoint
//      redirects only to the CTA stored on the campaign, which closes the open
//      redirect that a `?url=` parameter would otherwise create.
//   3. Unknown tokens get the same answer as known ones, so these endpoints
//      cannot be used to test whether an address is on a list.
import { Router } from 'express';
import { query } from '../db.js';
import { appUrl, escapeHtml } from '../email.js';
import { logActivity } from '../activity.js';

export const campaignsPublicRouter = Router();

// A 1x1 fully transparent GIF, inline so no file read is needed per open.
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// Any token-shaped string is routed here, including obviously invalid ones, so
// that a malformed token gets the same neutral answer as an unknown one rather
// than a distinguishable 404.
const TOKEN = '[A-Za-z0-9_-]{1,128}';

/** Opens and clicks record the *first* occurrence only, so counts stay distinct. */
async function markFirst(column, token) {
  const { rows } = await query(
    `UPDATE campaign_recipients
        SET ${column} = COALESCE(${column}, now()), updated_at = now()
      WHERE public_token = $1
      RETURNING campaign_id`, [token]);
  return rows[0] || null;
}

campaignsPublicRouter.get(`/campaigns/open/:token(${TOKEN}).gif`, async (req, res) => {
  try {
    await markFirst('first_opened_at', req.params.token);
  } catch {
    // Tracking must never break the message being read.
  }
  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': String(PIXEL.length),
    'Cache-Control': 'no-store, private, max-age=0',
    Pragma: 'no-cache'
  });
  res.end(PIXEL);
});

campaignsPublicRouter.get(`/campaigns/click/:token(${TOKEN})`, async (req, res, next) => {
  try {
    const marked = await markFirst('first_clicked_at', req.params.token);
    let destination = appUrl();
    if (marked) {
      const { rows } = await query('SELECT cta_url FROM campaigns WHERE id = $1', [marked.campaign_id]);
      if (rows[0]?.cta_url) destination = rows[0].cta_url;
    }
    res.redirect(302, destination);
  } catch (err) { next(err); }
});

/** Suppress every record holding this address. Unsubscribe always wins. */
async function suppress(email) {
  const normalised = String(email || '').trim().toLowerCase();
  if (!normalised) return 0;
  const users = await query(
    `UPDATE users SET marketing_opt_in = false, marketing_opted_out_at = now()
      WHERE lower(email) = $1 RETURNING id`, [normalised]);
  const contacts = await query(
    `UPDATE contacts SET marketing_opt_in = false, marketing_opted_out_at = now()
      WHERE lower(email) = $1 RETURNING id`, [normalised]);
  return users.rowCount + contacts.rowCount;
}

campaignsPublicRouter.post(`/campaigns/unsubscribe/:token(${TOKEN})`, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT email FROM campaign_recipients WHERE public_token = $1', [req.params.token]);
    if (rows[0]) {
      const affected = await suppress(rows[0].email);
      if (affected) {
        await logActivity({
          kind: 'campaign', title: 'Marketing unsubscribe',
          body: `${affected} record(s) opted out`, tone: 'orange'
        });
      }
    }
    // Identical for known and unknown tokens.
    res.json({ ok: true, message: 'You are unsubscribed from marketing emails.' });
  } catch (err) { next(err); }
});

/**
 * The confirmation page. Served outside /api because it is opened by a person,
 * and it deliberately does not echo the address back: anyone holding the link
 * would otherwise learn which address it belongs to.
 */
export const unsubscribePageRouter = Router();

unsubscribePageRouter.get(`/unsubscribe/:token(${TOKEN})`, (req, res) => {
  const token = escapeHtml(req.params.token);
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribe — HBBA Global</title>
  <style>
    body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
           background: #f4f6fb; color: #101828; margin: 0; padding: 48px 20px; }
    .card { max-width: 460px; margin: 0 auto; background: #fff; border: 1px solid #e4e8f0;
            border-radius: 14px; padding: 28px; }
    h1 { font-size: 20px; margin: 0 0 10px; }
    p { color: #475467; font-size: 14px; line-height: 1.6; }
    button { background: #1f3a73; color: #fff; border: 0; border-radius: 9px;
             padding: 11px 18px; font-weight: 600; font-size: 14px; cursor: pointer; }
    .done { display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-weight:800;color:#1f3a73">HBBA Global</div>
    <h1>Unsubscribe from marketing emails</h1>
    <p>You will stop receiving campaign emails. Account and billing messages are not affected.</p>
    <form method="post" action="/api/campaigns/unsubscribe/${token}" id="form">
      <button type="submit">Unsubscribe me</button>
    </form>
    <p class="done" id="done">You are unsubscribed from marketing emails.</p>
  </div>
  <script>
    document.getElementById('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      await fetch(event.target.action, { method: 'POST' }).catch(() => {});
      event.target.style.display = 'none';
      document.getElementById('done').style.display = 'block';
    });
  </script>
</body>
</html>`);
});
