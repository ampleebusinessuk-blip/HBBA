// Delegated admin capabilities.
//
// Roles answer "what kind of account is this"; permissions answer "what may
// this particular account do beyond its own portal". An administrator holds
// every permission by virtue of the role, so granting is only ever about
// members and sponsors.
//
// The grant lives on the user row, but the *check* is always made server-side
// against the database, never against the token: revoking access must take
// effect immediately rather than when a cookie happens to expire.
import { query } from './db.js';

/** Every capability that can be granted, and what it unlocks. */
export const PERMISSIONS = [
  { key: 'crm.manage', label: 'CRM', description: 'Contacts and the deal pipeline' },
  { key: 'events.manage', label: 'Events', description: 'Create, edit and cancel events' },
  { key: 'tickets.manage', label: 'Ticket desk', description: 'Issue tickets, check attendees in, refund' },
  { key: 'memberships.manage', label: 'Memberships', description: 'Tiers, renewals and reminders' },
  { key: 'sponsors.manage', label: 'Sponsors', description: 'Sponsor contracts and packages' },
  { key: 'campaigns.manage', label: 'Email marketing', description: 'Write and send campaigns' },
  { key: 'invoices.manage', label: 'Invoices', description: 'Raise, chase and settle invoices' },
  { key: 'support.manage', label: 'Support', description: 'Answer and resolve every ticket' },
  { key: 'tasks.manage', label: 'Tasks', description: 'The shared task board' },
  { key: 'networking.manage', label: 'Networking', description: 'Accept and decline introductions' },
  { key: 'reports.view', label: 'Reports', description: 'Organisation-wide figures' }
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

/** Keep only capabilities we actually define; ignore anything invented. */
export function sanitisePermissions(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((key) => PERMISSION_KEYS.includes(key)))];
}

/** What this request may do. Admins hold everything. */
export async function permissionsFor(auth) {
  if (!auth) return [];
  if (auth.role === 'admin') return [...PERMISSION_KEYS];
  const { rows } = await query('SELECT permissions, role, status FROM users WHERE id = $1', [auth.sub]);
  if (!rows[0] || rows[0].status === 'suspended') return [];
  if (rows[0].role === 'admin') return [...PERMISSION_KEYS];
  return sanitisePermissions(rows[0].permissions);
}

/**
 * Guard a route with a capability. Admins pass by role; everyone else needs the
 * grant, re-read from the database on every request so a revocation is instant.
 */
export function requirePermission(...keys) {
  return async (req, res, next) => {
    try {
      if (!req.auth) return res.status(401).json({ error: 'Not authenticated' });
      if (req.auth.role === 'admin') return next();
      const held = await permissionsFor(req.auth);
      if (keys.some((key) => held.includes(key))) {
        req.grantedPermissions = held;
        return next();
      }
      return res.status(403).json({ error: 'Forbidden' });
    } catch (err) { next(err); }
  };
}

export async function setPermissions(email, permissions) {
  const clean = sanitisePermissions(permissions);
  const { rows } = await query(
    `UPDATE users SET permissions = $1::jsonb
      WHERE lower(email) = lower($2) AND role <> 'admin'
      RETURNING email, full_name, role, permissions`,
    [JSON.stringify(clean), email]);
  if (!rows[0]) {
    const err = new Error('User not found, or is already an administrator');
    err.status = 404;
    throw err;
  }
  return rows[0];
}
