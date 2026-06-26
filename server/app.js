import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attachUser } from './auth.js';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachUser);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter);
  app.use('/api', dataRouter);

  // Unknown API routes should 404 as JSON, not fall through to the SPA.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Static frontend (existing vanilla UI under public/).
  app.use(express.static(publicDir, { index: 'index.html' }));

  // Error handler — log details, never leak them.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
