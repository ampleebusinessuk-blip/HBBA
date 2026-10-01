import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attachUser } from './auth.js';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';
import { invoicesRouter, publicInvoiceRouter } from './routes/invoices.js';
import { clientsRouter } from './routes/clients.js';
import { profileRouter } from './routes/profile.js';
import { supportRouter } from './routes/support.js';
import { crmRouter } from './routes/crm.js';
import { stripeRouter } from './routes/stripe.js';
import { opsRouter } from './routes/ops.js';
import { campaignsPublicRouter, unsubscribePageRouter } from './routes/campaigns-public.js';
import { ensureSettingsLoaded } from './settings.js';
import { settingsRouter } from './routes/settings.js';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// How many requests one address may make per minute. The limiter counts by IP,
// so a whole office behind a single NAT shares one budget — raise these if a
// legitimate team starts seeing 429s.
const API_RATE_LIMIT = Number(process.env.API_RATE_LIMIT) || 240;
const AUTH_RATE_LIMIT = Number(process.env.AUTH_RATE_LIMIT) || 30;

// Lightweight in-memory rate limiter (per instance). Good enough to blunt brute
// force on auth; swap for a shared store if scaling across many instances.
function rateLimit({ windowMs = 60000, max = 60 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
    const now = Date.now();
    const rec = hits.get(ip) || { count: 0, reset: now + windowMs };
    if (now > rec.reset) { rec.count = 0; rec.reset = now + windowMs; }
    rec.count++;
    hits.set(ip, rec);
    if (rec.count > max) return res.status(429).json({ error: 'Too many requests — please slow down' });
    next();
  };
}

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  // The Stripe webhook needs the raw body for signature checks, so it is
  // mounted ahead of the JSON parser.
  app.use('/api', stripeRouter);

  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  // Baseline security headers (no CSP — the UI relies on inline handlers/styles).
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  app.use(attachUser);

  // Settings are cached in-process; refresh when stale so a credential saved on
  // one instance reaches the others. Never blocks a request if the lookup fails.
  app.use(async (_req, _res, next) => {
    try { await ensureSettingsLoaded(); } catch { /* fall back to environment */ }
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Blanket limit for the API, with a tighter one on the auth surface.
  app.use('/api', rateLimit({ windowMs: 60000, max: API_RATE_LIMIT }));
  // Ops routes must sit ahead of the routers that require a session, or their
  // auth middleware answers first.
  // Campaign tracking and unsubscribe are opened from an email client, so they
  // sit ahead of every router that demands a session.
  app.use('/api', campaignsPublicRouter);
  app.use(unsubscribePageRouter);
  // An invoice link is opened by a client who has no account at all, so it must
  // also sit ahead of the routers that demand a session.
  app.use('/api', publicInvoiceRouter);

  app.use('/api', opsRouter);
  app.use('/api/auth', rateLimit({ windowMs: 60000, max: AUTH_RATE_LIMIT }), authRouter);
  // Terminate the auth surface: without this, an unknown /api/auth/* path falls
  // through to a router that requires a session and answers 401, which reads as
  // "wrong credentials" when the route simply does not exist.
  app.use('/api/auth', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use('/api', invoicesRouter);
  app.use('/api', clientsRouter);
  app.use('/api', profileRouter);
  app.use('/api', supportRouter);
  app.use('/api', settingsRouter);
  app.use('/api', crmRouter);
  app.use('/api', dataRouter);

  // Unknown API routes should 404 as JSON, not fall through to the SPA.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Static frontend (existing vanilla UI under public/).
  app.use(express.static(publicDir, { index: 'index.html' }));

  // SPA fallback: any non-API GET serves the app shell (deep links / refresh).
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(publicDir, 'index.html'));
  });

  // Error handler — log details, never leak them.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
