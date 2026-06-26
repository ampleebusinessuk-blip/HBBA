// Vercel serverless entry. The whole Express app runs as one function;
// vercel.json routes /api/* here, static assets are served from public/ by the CDN.
import { createApp } from '../server/app.js';

export default createApp();
