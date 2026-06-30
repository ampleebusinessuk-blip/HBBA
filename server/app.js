import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attachUser } from './auth.js';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';
import { invoicesRouter } from './routes/invoices.js';
import { supportRouter } from './routes/support.js';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

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

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', rateLimit({ windowMs: 60000, max: 30 }), authRouter);
  app.use('/api', invoicesRouter);
  app.use('/api', supportRouter);
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
