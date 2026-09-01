import { Router } from 'express';
import { query } from '../db.js';
import { logActivity } from '../activity.js';
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
    setAuthCookie(res, signToken(row));
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

    setAuthCookie(res, signToken(user));
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
