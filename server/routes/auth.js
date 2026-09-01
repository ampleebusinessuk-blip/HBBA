import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { query } from '../db.js';
import { logActivity } from '../activity.js';
import { sendEmail, layout, appUrl, emailConfigured } from '../email.js';
import { googleConfigured, googleAuthUrl, exchangeGoogleCode } from '../google.js';
import { createResetLink, findLiveToken, consumeToken, RESET_TTL_MINUTES } from '../tokens.js';
import {
  hashPassword, verifyPassword, signToken,
  setAuthCookie, clearAuthCookie, requireAuth
} from '../auth.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNUP_ROLES = ['member', 'sponsor'];


function publicUser(u) {
  return { id: u.id, email: u.email, role: u.role, full_name: u.full_name, org: u.org, status: u.status };
}

authRouter.post('/signup', async (req, res, next) => {
  try {
    const { email, password, full_name, org, role } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'Valid email required' });
    if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!full_name || !String(full_name).trim()) return res.status(400).json({ error: 'Name required' });
    if (!SIGNUP_ROLES.includes(role)) return res.status(400).json({ error: 'Choose Member or Sponsor' });

    const hash = await hashPassword(String(password));
    let row;
    try {
      const result = await query(
        `INSERT INTO users (email, password_hash, role, full_name, org, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING *`,
        [cleanEmail, hash, role, String(full_name).trim(), org ? String(org).trim() : null]
      );
      row = result.rows[0];
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'An account with that email already exists' });
      throw err;
    }

    await logActivity({
      kind: 'signup', title: `New ${row.role} registered`,
      body: `${row.full_name}${row.org ? ` — ${row.org}` : ''}`, tone: 'green'
    });
    setAuthCookie(res, signToken(row), { remember: req.body?.remember !== false });
    res.status(201).json({ user: publicUser(row) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const result = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    const user = result.rows[0];

    const ok = user && (await verifyPassword(String(password || ''), user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.status === 'suspended') return res.status(403).json({ error: 'This account is suspended. Contact your HBBA admin.' });

    setAuthCookie(res, signToken(user), { remember: req.body?.remember !== false });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.auth.sub]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

/* ===================== PASSWORD RESET ===================== */

// Always answers 200 so the form cannot be used to discover which emails exist.
authRouter.post('/forgot', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email required' });
    const { rows } = await query('SELECT id, full_name FROM users WHERE email = $1', [email]);
    if (rows[0]) {
      const { link } = await createResetLink(rows[0].id, 'reset');
      await sendEmail({
        to: email,
        subject: 'Reset your HBBA Global password',
        kind: 'password-reset',
        html: layout({
          heading: 'Reset your password',
          body: `<p>Hi ${rows[0].full_name},</p><p>Use the button below to choose a new password. The link expires in ${RESET_TTL_MINUTES} minutes and can only be used once.</p><p>If you did not ask for this, you can ignore this email.</p>`,
          cta: { url: link, label: 'Choose a new password' }
        }),
        text: `Reset your HBBA Global password: ${link}`
      });
      if (!emailConfigured()) {
        await logActivity({
          kind: 'auth', title: 'Password reset requested',
          body: `${email} — no email provider connected, reset them manually`, tone: 'orange'
        });
      }
    }
    res.json({
      ok: true,
      delivered: emailConfigured(),
      message: emailConfigured()
        ? 'If that email has an account, a reset link is on its way.'
        : 'Email delivery is not connected yet — ask your HBBA admin to reset the password.'
    });
  } catch (err) { next(err); }
});

authRouter.post('/reset', async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!token) return res.status(400).json({ error: 'Reset token required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const live = await findLiveToken(token);
    if (!live) return res.status(400).json({ error: 'That link has expired or has already been used' });

    const hash = await hashPassword(password);
    await query(`UPDATE users SET password_hash = $1, status = CASE WHEN status = 'pending' THEN 'active' ELSE status END WHERE id = $2`,
      [hash, live.user_id]);
    await consumeToken(live.id);
    await logActivity({
      kind: 'auth', title: live.purpose === 'invite' ? 'Invite accepted' : 'Password changed',
      body: live.email, tone: 'green'
    });

    const user = { id: live.user_id, email: live.email, role: live.role, full_name: live.full_name, org: live.org, status: 'active' };
    setAuthCookie(res, signToken(user));
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

/* ===================== SIGN IN WITH GOOGLE ===================== */

// Which optional sign-in paths this deployment actually supports.
authRouter.get('/providers', (_req, res) => {
  res.json({ google: googleConfigured(), email: emailConfigured() });
});

authRouter.get('/google', (req, res) => {
  if (!googleConfigured()) return res.status(503).json({ error: 'Google sign-in is not configured' });
  const state = randomBytes(16).toString('hex');
  res.cookie('hbba_oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000, path: '/' });
  res.redirect(googleAuthUrl(state));
});

authRouter.get('/google/callback', async (req, res, next) => {
  try {
    if (!googleConfigured()) return res.status(503).json({ error: 'Google sign-in is not configured' });
    if (req.query.error) return res.redirect('/#login?error=google');
    const state = String(req.query.state || '');
    if (!state || state !== req.cookies?.hbba_oauth_state) return res.redirect('/#login?error=state');
    res.clearCookie('hbba_oauth_state', { path: '/' });

    const profile = await exchangeGoogleCode(String(req.query.code || ''));
    if (!profile?.email) return res.redirect('/#login?error=google');
    const email = profile.email.toLowerCase();

    let { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows[0]) {
      const placeholder = await hashPassword(randomBytes(24).toString('hex'));
      ({ rows } = await query(
        `INSERT INTO users (email, password_hash, role, full_name, status)
         VALUES ($1, $2, 'member', $3, 'active') RETURNING *`,
        [email, placeholder, profile.name || email.split('@')[0]]));
      await logActivity({ kind: 'signup', title: 'New member registered', body: `${rows[0].full_name} — via Google`, tone: 'green' });
    }
    if (rows[0].status === 'suspended') return res.redirect('/#login?error=suspended');

    setAuthCookie(res, signToken(rows[0]));
    res.redirect('/');
  } catch (err) { next(err); }
});
