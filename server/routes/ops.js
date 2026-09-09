// Operational endpoint for applying schema migrations from inside a running
// deployment. Vercel marks the production DATABASE_URL as sensitive, so it
// cannot be pulled locally — this lets the deployment migrate its own database.
//
// Gated on MIGRATE_TOKEN: with the variable unset the route does not exist at
// all. Remove the variable once the migration has run.
import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { runMigrations } from '../../migrations/run.js';

export const opsRouter = Router();

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
