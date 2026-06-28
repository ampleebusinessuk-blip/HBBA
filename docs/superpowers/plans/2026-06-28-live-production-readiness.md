# Live Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the existing HBBA Express/Postgres app for live Vercel deployment with production-safe configuration, clear database/admin setup, reliable verification, and client-ready documentation.

**Architecture:** Keep the current vanilla frontend, Express API, Vercel serverless entry, and Postgres schema. Add small focused modules for runtime configuration and admin bootstrap validation, then wire them into existing auth/db/scripts without changing the app shape.

**Tech Stack:** Node.js ESM, Express 4, pg, bcryptjs, jsonwebtoken, node:test, Vercel, Postgres.

## Global Constraints

- Keep the existing architecture: vanilla frontend in `public/`, Express API in `server/`, Vercel serverless entry in `api/index.js`, and Postgres for persistent data.
- Production requires `DATABASE_URL`, `JWT_SECRET`, and `NODE_ENV=production`.
- Production must not silently use `dev-only-change-me` or a localhost database URL.
- Production should not create weak demo accounts unless explicitly requested.
- Do not rewrite the frontend in React or Next.js.
- The local Vercel CLI is currently not installed; document installing it with `npm i -g vercel`.

---

## File Structure

- Create `server/config.js`: central runtime configuration, production guards, database pool options.
- Modify `server/auth.js`: consume validated JWT config instead of hardcoded unsafe defaults.
- Modify `server/db.js`: consume validated database config and add fast connection failure behavior.
- Create `server/admin-bootstrap.js`: validate and upsert a first admin user with a strong password.
- Create `scripts/bootstrap-admin.js`: CLI entrypoint for first-admin creation.
- Modify `package.json`: add `bootstrap:admin` script.
- Modify `.env.example`: clarify local and production variables.
- Modify `README.md`: replace prototype README with setup, deploy, migration, admin bootstrap, and smoke checks.
- Modify `public/index.html`: remove prototype page title.
- Modify `public/app.js`: remove prototype/no-backend header and fix visible mojibake where it affects trust.
- Modify `test/auth.test.js`: add DB readiness fail-fast helper and admin-route protection coverage.
- Create `test/config.test.js`: no-DB tests for production guard behavior.
- Create `test/admin-bootstrap.test.js`: no-DB tests for first-admin input validation.
- Create `test/data.test.js`: DB-backed member/sponsor/admin endpoint smoke coverage.

---

### Task 1: Runtime Configuration Guards

**Files:**
- Create: `server/config.js`
- Modify: `server/auth.js`
- Modify: `server/db.js`
- Test: `test/config.test.js`

**Interfaces:**
- Produces: `getRuntimeConfig(env?: NodeJS.ProcessEnv): { nodeEnv: string, isProduction: boolean, jwtSecret: string, databaseUrl: string, pgPoolOptions: { connectionString: string, max: number, connectionTimeoutMillis: number, idleTimeoutMillis: number, ssl?: { rejectUnauthorized: boolean } } }`
- Consumes: Existing `process.env`, `pg.Pool`, `jsonwebtoken`.

- [ ] **Step 1: Write the failing config tests**

Create `test/config.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRuntimeConfig } from '../server/config.js';

test('development config uses explicit safe local defaults', () => {
  const cfg = getRuntimeConfig({});
  assert.equal(cfg.nodeEnv, 'development');
  assert.equal(cfg.isProduction, false);
  assert.equal(cfg.jwtSecret, 'dev-only-change-me');
  assert.equal(cfg.databaseUrl, 'postgres://hbba:hbba@localhost:5544/hbba');
  assert.equal(cfg.pgPoolOptions.connectionTimeoutMillis, 3000);
});

test('production rejects missing database url', () => {
  assert.throws(
    () => getRuntimeConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) }),
    /DATABASE_URL is required in production/
  );
});

test('production rejects unsafe jwt secret', () => {
  assert.throws(
    () => getRuntimeConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://prod.example/hbba', JWT_SECRET: 'dev-only-change-me' }),
    /JWT_SECRET must be a long random value in production/
  );
});

test('production rejects localhost database url', () => {
  assert.throws(
    () => getRuntimeConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://hbba:hbba@localhost:5544/hbba', JWT_SECRET: 'x'.repeat(32) }),
    /DATABASE_URL must not point at localhost in production/
  );
});

test('production accepts managed postgres url and enables ssl unless explicitly disabled', () => {
  const cfg = getRuntimeConfig({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://user:pass@db.example.com:5432/hbba',
    JWT_SECRET: 'x'.repeat(32)
  });
  assert.equal(cfg.isProduction, true);
  assert.deepEqual(cfg.pgPoolOptions.ssl, { rejectUnauthorized: false });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/config.test.js`

Expected: FAIL with `Cannot find module '../server/config.js'`.

- [ ] **Step 3: Implement runtime config**

Create `server/config.js`:

```js
const LOCAL_DATABASE_URL = 'postgres://hbba:hbba@localhost:5544/hbba';
const DEV_JWT_SECRET = 'dev-only-change-me';

function isLocalDatabaseUrl(url) {
  return /@(localhost|127\.0\.0\.1|\[::1\])(?::|\/)/i.test(url) || /\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/)/i.test(url);
}

export function getRuntimeConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const databaseUrl = env.DATABASE_URL || LOCAL_DATABASE_URL;
  const jwtSecret = env.JWT_SECRET || DEV_JWT_SECRET;

  if (isProduction && !env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }

  if (isProduction && (jwtSecret === DEV_JWT_SECRET || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be a long random value in production');
  }

  if (isProduction && isLocalDatabaseUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must not point at localhost in production');
  }

  const pgPoolOptions = {
    connectionString: databaseUrl,
    max: Number(env.PG_POOL_MAX || 5),
    connectionTimeoutMillis: Number(env.PG_CONNECTION_TIMEOUT_MS || 3000),
    idleTimeoutMillis: Number(env.PG_IDLE_TIMEOUT_MS || 30000)
  };

  if (isProduction && env.PGSSL !== 'disable') {
    pgPoolOptions.ssl = { rejectUnauthorized: false };
  }

  return { nodeEnv, isProduction, databaseUrl, jwtSecret, pgPoolOptions };
}
```

Modify `server/auth.js`:

```js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRuntimeConfig } from './config.js';

const { jwtSecret, isProduction } = getRuntimeConfig();
const TOKEN_TTL = '7d';
export const COOKIE_NAME = 'hbba_token';

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function attachUser(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  req.auth = token ? verifyToken(token) : null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
```

Modify `server/db.js`:

```js
import pg from 'pg';
import 'dotenv/config';
import { getRuntimeConfig } from './config.js';

const { pgPoolOptions } = getRuntimeConfig();

const g = globalThis;
export const pool = g.__hbbaPool || (g.__hbbaPool = new pg.Pool(pgPoolOptions));

export function query(text, params) {
  return pool.query(text, params);
}

export async function closePool() {
  await pool.end();
  delete globalThis.__hbbaPool;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/config.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/config.js server/auth.js server/db.js test/config.test.js
git commit -m "feat: guard production runtime config"
```

---

### Task 2: Test Reliability And Auth Coverage

**Files:**
- Modify: `test/auth.test.js`

**Interfaces:**
- Consumes: Existing `createApp()`, `pool`, `closePool()`, auth API routes.
- Produces: Fail-fast DB readiness behavior and admin route protection tests.

- [ ] **Step 1: Write the failing/expanded auth tests**

Modify the top of `test/auth.test.js` to ping the database before starting the app:

```js
before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }

  await new Promise((resolve) => {
    server = createApp().listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
```

Append these tests:

```js
test('member cannot access admin stats', async () => {
  const email = newEmail();
  const signup = await req('/api/auth/signup', { method: 'POST', body: { email, password: 'password123', full_name: 'Member User', role: 'member' } });
  const cookie = cookieOf(signup);

  const res = await req('/api/admin/stats', { cookie });
  assert.equal(res.status, 403);
});

test('unauthenticated admin stats returns 401', async () => {
  const res = await req('/api/admin/stats');
  assert.equal(res.status, 401);
});
```

- [ ] **Step 2: Run test to verify behavior**

Run: `node --test test/auth.test.js`

Expected if DB is down: FAIL within about 3 seconds with `Test database is not reachable`.

Expected if DB is up and migrated: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/auth.test.js
git commit -m "test: fail fast when database is unavailable"
```

---

### Task 3: First Admin Bootstrap

**Files:**
- Create: `server/admin-bootstrap.js`
- Create: `scripts/bootstrap-admin.js`
- Modify: `package.json`
- Test: `test/admin-bootstrap.test.js`

**Interfaces:**
- Produces: `validateAdminInput(input: { email?: string, password?: string, fullName?: string, org?: string }, env?: NodeJS.ProcessEnv): { email: string, password: string, fullName: string, org: string }`
- Produces: `bootstrapAdmin(input, deps): Promise<{ email: string, created: boolean }>`
- Consumes: `query`, `hashPassword`, `closePool`.

- [ ] **Step 1: Write the failing validation tests**

Create `test/admin-bootstrap.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminInput } from '../server/admin-bootstrap.js';

test('validates and normalizes admin bootstrap input', () => {
  const input = validateAdminInput({
    email: ' OWNER@HBBA.CO.UK ',
    password: 'StrongPassword123',
    fullName: ' Owner User ',
    org: ' HBBA '
  });

  assert.deepEqual(input, {
    email: 'owner@hbba.co.uk',
    password: 'StrongPassword123',
    fullName: 'Owner User',
    org: 'HBBA'
  });
});

test('rejects invalid admin email', () => {
  assert.throws(
    () => validateAdminInput({ email: 'bad', password: 'StrongPassword123', fullName: 'Owner' }),
    /ADMIN_EMAIL must be a valid email/
  );
});

test('rejects weak admin password', () => {
  assert.throws(
    () => validateAdminInput({ email: 'owner@hbba.co.uk', password: 'short', fullName: 'Owner' }),
    /ADMIN_PASSWORD must be at least 12 characters/
  );
});

test('rejects demo password in production', () => {
  assert.throws(
    () => validateAdminInput(
      { email: 'owner@hbba.co.uk', password: 'hbbaglobal', fullName: 'Owner' },
      { NODE_ENV: 'production' }
    ),
    /ADMIN_PASSWORD must not use the demo password in production/
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/admin-bootstrap.test.js`

Expected: FAIL with `Cannot find module '../server/admin-bootstrap.js'`.

- [ ] **Step 3: Implement admin bootstrap module and script**

Create `server/admin-bootstrap.js`:

```js
import { hashPassword } from './auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAdminInput(input, env = process.env) {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const fullName = String(input.fullName || '').trim();
  const org = String(input.org || 'HBBA Global').trim();

  if (!EMAIL_RE.test(email)) throw new Error('ADMIN_EMAIL must be a valid email');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  if (env.NODE_ENV === 'production' && password === 'hbbaglobal') {
    throw new Error('ADMIN_PASSWORD must not use the demo password in production');
  }
  if (!fullName) throw new Error('ADMIN_FULL_NAME is required');

  return { email, password, fullName, org };
}

export async function bootstrapAdmin(input, deps) {
  const clean = validateAdminInput(input);
  const passwordHash = await hashPassword(clean.password);
  const result = await deps.query(
    `INSERT INTO users (email, password_hash, role, full_name, org, status)
     VALUES ($1, $2, 'admin', $3, $4, 'active')
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       full_name = EXCLUDED.full_name,
       org = EXCLUDED.org,
       status = 'active'
     RETURNING email, (xmax = 0) AS created`,
    [clean.email, passwordHash, clean.fullName, clean.org]
  );

  return { email: result.rows[0].email, created: result.rows[0].created };
}
```

Create `scripts/bootstrap-admin.js`:

```js
import 'dotenv/config';
import { query, closePool } from '../server/db.js';
import { bootstrapAdmin } from '../server/admin-bootstrap.js';

async function main() {
  const result = await bootstrapAdmin({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullName: process.env.ADMIN_FULL_NAME,
    org: process.env.ADMIN_ORG
  }, { query });

  console.log(`${result.created ? 'created' : 'updated'} admin ${result.email}`);
}

main()
  .then(closePool)
  .catch(async (err) => {
    await closePool();
    console.error(err.message);
    process.exit(1);
  });
```

Modify `package.json` scripts:

```json
"bootstrap:admin": "node scripts/bootstrap-admin.js"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/admin-bootstrap.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/admin-bootstrap.js scripts/bootstrap-admin.js package.json test/admin-bootstrap.test.js
git commit -m "feat: add first admin bootstrap"
```

---

### Task 4: Data Endpoint Smoke Tests

**Files:**
- Create: `test/data.test.js`

**Interfaces:**
- Consumes: `createApp()`, `pool`, `/api/events`, `/api/me/bookings`, `/api/sponsor/overview`, `/api/admin/stats`, `/api/admin/events`.
- Produces: DB-backed smoke tests for member, sponsor, and admin flows.

- [ ] **Step 1: Write DB-backed endpoint smoke tests**

Create `test/data.test.js`:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

let server;
let base;
let memberCookie;
let sponsorCookie;
let adminCookie;

async function req(path, { method = 'GET', body, cookie } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];

async function upsertUser(email, role) {
  const passwordHash = await hashPassword('password123');
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, org, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role
     RETURNING id`,
    [email, passwordHash, role, `${role} smoke`, `${role} org`]
  );
  return rows[0].id;
}

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }

  const memberId = await upsertUser('smoke.member@example.com', 'member');
  const sponsorId = await upsertUser('smoke.sponsor@example.com', 'sponsor');
  await upsertUser('smoke.admin@example.com', 'admin');

  await pool.query(
    `INSERT INTO events (code, title, date_label, time_label, city, capacity, status)
     VALUES ('SMOKE-EVENT', 'Smoke Test Event', '1 Jul', '10 AM', 'London', 20, 'Selling')
     ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title`
  );

  await pool.query(
    `INSERT INTO sponsorships (user_id, tier, value_cents, renews, since, impressions, placements, leads_count, meetings, inclusions)
     VALUES ($1, 'Gold', 100000, 'Jul 2027', 'Jul 2026', 1000, 3, 2, 1, '["Logo placement"]')
     ON CONFLICT (user_id) DO UPDATE SET tier=EXCLUDED.tier`,
    [sponsorId]
  );

  await pool.query(
    `INSERT INTO invoices (number, user_id, description, amount_cents, issued_on, status)
     VALUES ('SMOKE-INV-MEMBER', $1, 'Smoke invoice', 1000, '1 Jul', 'paid')
     ON CONFLICT (number) DO UPDATE SET user_id=EXCLUDED.user_id`,
    [memberId]
  );

  await new Promise((resolve) => {
    server = createApp().listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'smoke.member@example.com', password: 'password123' } }));
  sponsorCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'smoke.sponsor@example.com', password: 'password123' } }));
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'smoke.admin@example.com', password: 'password123' } }));
});

after(async () => {
  await pool.query("DELETE FROM invoices WHERE number LIKE 'SMOKE-%'");
  await pool.query("DELETE FROM sponsorships WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'smoke.%@example.com')");
  await pool.query("DELETE FROM users WHERE email LIKE 'smoke.%@example.com'");
  await pool.query("DELETE FROM events WHERE code LIKE 'SMOKE-%'");
  await new Promise((r) => server.close(r));
  await closePool();
});

test('member can view events, book an event, and see tickets', async () => {
  const events = await req('/api/events', { cookie: memberCookie });
  assert.equal(events.status, 200);
  assert.ok((await events.json()).events.some((event) => event.id === 'SMOKE-EVENT'));

  const booking = await req('/api/events/SMOKE-EVENT/book', { method: 'POST', cookie: memberCookie, body: { tier: 'VIP' } });
  assert.equal(booking.status, 201);

  const tickets = await req('/api/me/bookings', { cookie: memberCookie });
  assert.equal(tickets.status, 200);
  assert.ok((await tickets.json()).tickets.some((ticket) => ticket.event === 'Smoke Test Event'));
});

test('sponsor can view overview', async () => {
  const overview = await req('/api/sponsor/overview', { cookie: sponsorCookie });
  assert.equal(overview.status, 200);
  assert.equal((await overview.json()).overview.tier, 'Gold');
});

test('admin can view stats and create event', async () => {
  const stats = await req('/api/admin/stats', { cookie: adminCookie });
  assert.equal(stats.status, 200);

  const created = await req('/api/admin/events', {
    method: 'POST',
    cookie: adminCookie,
    body: { title: 'Smoke Created Event', date_label: '2 Jul', time_label: '2 PM', city: 'London', capacity: 30 }
  });
  assert.equal(created.status, 201);
  assert.ok((await created.json()).event.code.startsWith('E'));
});
```

- [ ] **Step 2: Run test to verify behavior**

Run: `node --test test/data.test.js`

Expected if DB is down: FAIL within about 3 seconds with `Test database is not reachable`.

Expected if DB is up and migrated: PASS.

- [ ] **Step 3: Commit**

```bash
git add test/data.test.js
git commit -m "test: cover production smoke data flows"
```

---

### Task 5: Client-Facing Frontend Polish

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`

**Interfaces:**
- Consumes: Existing frontend globals and renderers.
- Produces: Product-facing title/header comments and corrected visible text constants.

- [ ] **Step 1: Search for prototype and mojibake text**

Run: `Select-String -Path public\index.html,public\app.js -Pattern 'Prototype|UI Only|no backend|GitHub Pages|Â|ð|â'`

Expected now: matches in `public/index.html` and `public/app.js`.

- [ ] **Step 2: Replace visible prototype labels and common mojibake**

Modify `public/index.html`:

```html
<title>HBBA Global</title>
```

Modify the header comment in `public/app.js`:

```js
/* ============================================================
   HBBA Global - Member, Sponsor, and Admin Portals
   ============================================================ */
```

Replace visible mojibake in `public/app.js`:

```text
Â£ -> £
â€” -> -
â†µ -> Enter
â€œ -> "
â€ -> "
ðŸ‘‹ -> 👋
```

- [ ] **Step 3: Re-run the search**

Run: `Select-String -Path public\index.html,public\app.js -Pattern 'Prototype|UI Only|no backend|GitHub Pages|Â|ð|â'`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/app.js
git commit -m "fix: remove prototype copy and encoding artifacts"
```

---

### Task 6: Production Handoff Documentation

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Scripts `start`, `dev`, `migrate`, `seed`, `test`, `bootstrap:admin`.
- Produces: Client/developer setup, production environment, deployment, and smoke checklist docs.

- [ ] **Step 1: Replace `.env.example` content**

Use this content:

```env
# Local development defaults
DATABASE_URL=postgres://hbba:hbba@localhost:5544/hbba
JWT_SECRET=dev-only-change-me
PORT=3000
NODE_ENV=development

# Optional tuning
PG_POOL_MAX=5
PG_CONNECTION_TIMEOUT_MS=3000
PG_IDLE_TIMEOUT_MS=30000

# First production admin bootstrap
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_FULL_NAME=Owner User
ADMIN_ORG=HBBA Global
```

- [ ] **Step 2: Replace `README.md` content**

Use this structure:

```md
# HBBA Global

HBBA Global is a member, sponsor, and admin portal built with a vanilla frontend, Express API, and Postgres database.

## Local Setup

1. Install dependencies: `npm install`
2. Start Postgres: `docker compose up -d`
3. Copy env: `Copy-Item .env.example .env`
4. Run migrations: `npm run migrate`
5. Seed local demo data: `npm run seed`
6. Start app: `npm run dev`
7. Open `http://localhost:3000`

Local demo accounts use password `hbbaglobal`:

- `admin@hbbaglobal.co.uk`
- `member@hbbaglobal.co.uk`
- `sponsor@hbbaglobal.co.uk`

## Tests

Start Postgres and run migrations first:

```powershell
docker compose up -d
npm run migrate
npm test
```

If the database is not reachable, tests fail quickly with a setup message.

## Production Environment

Set these on Vercel before production deployment:

- `DATABASE_URL`: managed Postgres database URL.
- `JWT_SECRET`: at least 32 random characters.
- `NODE_ENV`: `production`.

Do not use the local demo `JWT_SECRET` or a localhost database URL in production. The app rejects those settings.

## Production Database

Run migrations against the production database before opening the app to users:

```powershell
$env:DATABASE_URL="postgres://..."
$env:JWT_SECRET="..."
$env:NODE_ENV="production"
npm run migrate
```

Create the first admin:

```powershell
$env:ADMIN_EMAIL="owner@example.com"
$env:ADMIN_PASSWORD="a-long-strong-password"
$env:ADMIN_FULL_NAME="Owner User"
$env:ADMIN_ORG="HBBA Global"
npm run bootstrap:admin
```

## Vercel Deployment

The repo is linked to the Vercel project `hbba`.

Install the CLI if needed:

```powershell
npm i -g vercel
vercel login
vercel pull
vercel --prod
```

You can also deploy through Vercel Git integration after setting the production environment variables.

## Smoke Checklist

- Visit the deployed site.
- Log in as admin.
- Log in as member.
- Log in as sponsor.
- Sign up as a member or sponsor.
- Book an event as a member.
- View invoices.
- Create an event as admin.
- Confirm a member gets `403` from `/api/admin/stats`.
```

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add production handoff guide"
```

---

### Task 7: Final Verification

**Files:**
- Modify only if previous verification exposes a defect.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: verified production-readiness branch.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected if DB is up and migrated: PASS.

Expected if DB is down: FAIL quickly with `Test database is not reachable`.

- [ ] **Step 2: Run app locally**

Run: `npm start`

Expected: console prints `HBBA Global running on http://localhost:3000`.

- [ ] **Step 3: Verify health endpoint**

Run in a second shell: `Invoke-RestMethod http://localhost:3000/api/health`

Expected:

```powershell
ok
--
True
```

- [ ] **Step 4: Check Vercel CLI availability**

Run: `vercel --version`

Expected if installed: prints a version.

Expected currently: command not found. Install with `npm i -g vercel` before deploying from CLI.

- [ ] **Step 5: Commit verification fixes if any were needed**

If Step 1-4 required code or docs fixes:

```bash
git add <changed-files>
git commit -m "fix: address production readiness verification"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

- Spec coverage: production env guards are Task 1; migration/admin bootstrap flow is Tasks 3 and 6; auth/security is Tasks 1 and 2; frontend readiness is Task 5; verification is Tasks 2, 4, and 7; deployment handoff is Task 6.
- Red-flag scan: the plan contains concrete file paths, code blocks, commands, and expected outcomes for each task.
- Type consistency: `getRuntimeConfig`, `validateAdminInput`, and `bootstrapAdmin` signatures are defined before any task consumes them.
