// Operational endpoint for applying schema migrations from inside a running
// deployment. Vercel marks the production DATABASE_URL as sensitive, so it
// cannot be pulled locally — this lets the deployment migrate its own database.
//
// Gated on MIGRATE_TOKEN: with the variable unset the route does not exist at
// all. Remove the variable once the migration has run.
import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { runMigrations } from '../../migrations/run.js';
import { dueCampaigns, deliverCampaign } from '../campaigns.js';
import { query } from '../db.js';

export const opsRouter = Router();

/** Constant-time comparison that tolerates absent or differently sized input. */
function secretMatches(given, expected) {
  if (!expected || !given) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function tokenMatches(given) {
  const expected = process.env.MIGRATE_TOKEN || '';
  if (!expected || !given) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

opsRouter.post('/ops/migrate', async (req, res, next) => {
  try {
    if (!process.env.MIGRATE_TOKEN) return res.status(404).json({ error: 'Not found' });
    if (!tokenMatches(req.headers['x-migrate-token'])) {
      return res.status(401).json({ error: 'Invalid migrate token' });
    }
    const lines = [];
    const result = await runMigrations({ log: (m) => lines.push(m) });
    res.json({ ok: true, ...result, log: lines });
  } catch (err) { next(err); }
});

/**
 * Scheduled campaign delivery, invoked by Vercel Cron on the schedule in
 * vercel.json (daily on a Hobby plan, which is the only rate it allows).
 *
 * Without CRON_SECRET the route does not exist. The work itself is delegated to
 * the same delivery service the admin button uses, and claiming is atomic, so
 * two overlapping invocations cannot send a campaign twice.
 */
opsRouter.get('/ops/campaigns/run', async (req, res, next) => {
  try {
    const expected = process.env.CRON_SECRET;
    if (!expected) return res.status(404).json({ error: 'Not found' });

    const header = String(req.headers.authorization || '');
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!secretMatches(bearer, expected)) return res.status(401).json({ error: 'Invalid cron credentials' });

    // Bounded so one invocation stays inside the function's duration budget.
    const ids = await dueCampaigns(5, { query });
    const processed = [];
    for (const id of ids) {
      try {
        const result = await deliverCampaign(id, { query });
        processed.push({
          campaignId: id, claimed: result.claimed !== false, status: result.status,
          sent: result.sent ?? 0, failed: result.failed ?? 0, skipped: result.skipped ?? 0
        });
      } catch (err) {
        processed.push({ campaignId: id, claimed: false, status: 'Failed', error: err.message });
      }
    }
    res.json({ ok: true, due: ids.length, processed });
  } catch (err) { next(err); }
});
