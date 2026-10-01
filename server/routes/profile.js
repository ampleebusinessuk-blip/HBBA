// What a person maintains about themselves. Every role gets the same page: the
// account is theirs, so the name, picture and contact details are theirs to
// change. Role, status and permissions are deliberately absent — those belong
// to an administrator and are never writable from here.
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, hashPassword, verifyPassword } from '../auth.js';
import { logActivity } from '../activity.js';

export const profileRouter = Router();
profileRouter.use(requireAuth);

// An avatar is a 256px square by the time it leaves the browser, so anything
// large means something other than a resized photo arrived.
const AVATAR_MAX_CHARS = 200_000;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DATA_URL_RE = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/;

// Free text a person writes about themselves, with sane ceilings so one row
// cannot grow without bound.
const EDITABLE = {
  full_name: 120,
  org: 160,
  job_title: 120,
  phone: 40,
  city: 120,
  website: 200,
  bio: 2000
};

export function profileDTO(u) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    status: u.status,
    full_name: u.full_name || '',
    org: u.org || '',
    job_title: u.job_title || '',
    phone: u.phone || '',
    city: u.city || '',
    website: u.website || '',
    bio: u.bio || '',
    avatar: u.avatar_data || null,
    member_since: u.created_at
  };
}

profileRouter.get('/profile', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.auth.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ profile: profileDTO(rows[0]) });
  } catch (err) { next(err); }
});

profileRouter.patch('/profile', async (req, res, next) => {
  try {
    const fields = [];
    const vals = [];
    for (const [column, limit] of Object.entries(EDITABLE)) {
      if (req.body?.[column] === undefined) continue;
      const value = String(req.body[column] ?? '').trim();
      if (value.length > limit) return res.status(400).json({ error: `${column.replace('_', ' ')} is too long (max ${limit} characters)` });
      if (column === 'full_name' && !value) return res.status(400).json({ error: 'Your name cannot be empty' });
      if (column === 'website' && value && !/^https?:\/\/\S+\.\S+/.test(value)) {
        return res.status(400).json({ error: 'A website must start with http:// or https://' });
      }
      vals.push(value || null);
      fields.push(`${column} = $${vals.length}`);
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(req.auth.sub);
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals);
    if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ profile: profileDTO(rows[0]) });
  } catch (err) { next(err); }
});

// The picture is stored on the row, not on disk: a container filesystem does
// not survive a redeploy, and an avatar that vanishes on deploy is worse than
// none. The data URL is re-encoded from the decoded bytes so only an actual
// image of a declared type can be stored.
profileRouter.put('/profile/avatar', async (req, res, next) => {
  try {
    const raw = String(req.body?.avatar || '').trim();
    if (!raw) return res.status(400).json({ error: 'No image supplied' });
    if (raw.length > AVATAR_MAX_CHARS) {
      return res.status(413).json({ error: 'That picture is too large — choose a smaller image' });
    }
    const match = DATA_URL_RE.exec(raw);
    if (!match) return res.status(400).json({ error: 'That does not look like an image' });
    const [, mime, base64] = match;
    if (!AVATAR_TYPES.includes(mime)) return res.status(400).json({ error: 'Use a JPEG, PNG or WebP image' });

    const bytes = Buffer.from(base64, 'base64');
    if (!bytes.length) return res.status(400).json({ error: 'That image is empty' });
    const clean = `data:${mime};base64,${bytes.toString('base64')}`;

    const { rows } = await query(
      'UPDATE users SET avatar_data = $1 WHERE id = $2 RETURNING *', [clean, req.auth.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ profile: profileDTO(rows[0]) });
  } catch (err) { next(err); }
});

profileRouter.delete('/profile/avatar', async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE users SET avatar_data = NULL WHERE id = $1 RETURNING *', [req.auth.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ profile: profileDTO(rows[0]) });
  } catch (err) { next(err); }
});

// Changing a password requires the current one, so a borrowed session cannot
// lock the owner out of their own account.
profileRouter.post('/profile/password', async (req, res, next) => {
  try {
    const current = String(req.body?.current_password || '');
    const next_ = String(req.body?.new_password || '');
    if (next_.length < 8) return res.status(400).json({ error: 'Your new password must be at least 8 characters' });
    if (next_ === current) return res.status(400).json({ error: 'That is already your password' });

    const { rows } = await query('SELECT id, password_hash FROM users WHERE id = $1', [req.auth.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' });
    if (!await verifyPassword(current, rows[0].password_hash)) {
      return res.status(403).json({ error: 'Your current password is not right' });
    }

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(next_), req.auth.sub]);
    await logActivity({
      kind: 'account', title: 'Password changed', body: 'Changed from the profile page',
      tone: 'orange', role: 'all', userId: req.auth.sub
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
