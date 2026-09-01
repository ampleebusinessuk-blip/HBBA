import { query } from './db.js';

/**
 * Record something that actually happened so it shows up in the dashboard feed
 * and the notification panel. Never throws: a failed log must not fail a request.
 */
export async function logActivity({ kind, title, body = null, tone = 'blue', role = 'admin', userId = null }) {
  try {
    await query(
      `INSERT INTO activity_log (kind, title, body, tone, audience_role, audience_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [kind, title, body, tone, role, userId]
    );
  } catch {
    // Activity logging is best-effort.
  }
}

/** Feed rows visible to one user, newest first, with unread state. */
export async function feedFor(userId, role, limit = 20) {
  const { rows } = await query(
    `SELECT a.id, a.kind, a.title, a.body, a.tone, a.created_at,
            (r.user_id IS NULL) AS unread
       FROM activity_log a
       LEFT JOIN activity_reads r ON r.activity_id = a.id AND r.user_id = $1
      WHERE a.audience_user_id = $1
         OR (a.audience_user_id IS NULL AND a.audience_role IN ($2, 'all'))
      ORDER BY a.created_at DESC
      LIMIT $3`,
    [userId, role, limit]
  );
  return rows;
}

export async function markFeedRead(userId, role) {
  await query(
    `INSERT INTO activity_reads (activity_id, user_id)
     SELECT a.id, $1 FROM activity_log a
      WHERE a.audience_user_id = $1
         OR (a.audience_user_id IS NULL AND a.audience_role IN ($2, 'all'))
     ON CONFLICT DO NOTHING`,
    [userId, role]
  );
}
