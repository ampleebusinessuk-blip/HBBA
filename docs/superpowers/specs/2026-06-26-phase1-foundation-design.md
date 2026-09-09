# Phase 1 — Foundation (real auth + DB + deploy) — Design Spec

**Date:** 2026-06-26
**Status:** Approved, implementing
**Track:** Real SaaS product. This is Phase 1 of a multi-phase build (foundation,
member portal, sponsor portal, admin CRUD, payments, email+reports).

## Goal

Convert the static client-side prototype into a real application with a backend,
a database, and real authentication — without rewriting the existing vanilla UI.
After this phase, login is real and the user's role comes from the server. Page
*data* (members, events, invoices) stays seeded/mocked until each later phase wires
it to the database.

## Stack

- **Node + Express** (ESM), serves both the static frontend and a JSON API on one port.
- **Postgres**, run locally via Docker Compose for development.
- **Auth:** email + password, `bcryptjs` hashing, JWT in an httpOnly cookie.
- No framework rewrite — `index.html` / `app.js` / `styles.css` stay; the frontend
  calls the API with `fetch`.

## Architecture

```
Browser (vanilla UI)  ──fetch /api──▶  Express  ──▶  Postgres
   JWT httpOnly cookie                  bcrypt + JWT        users
```

Express responsibilities:
- Serve static files from the project root.
- `POST /api/auth/signup` — create account (member or sponsor), hash password, set cookie.
- `POST /api/auth/login` — verify password, set cookie.
- `POST /api/auth/logout` — clear cookie.
- `GET /api/me` — return the current user (id, email, role, full_name, org, status) or 401.
- `requireAuth` and `requireRole(...)` middleware for future protected routes.

## Data Model (Phase 1)

`users`
- `id` uuid primary key (default `gen_random_uuid()`)
- `email` text unique not null (stored lowercase)
- `password_hash` text not null
- `role` text not null check in (`admin`, `member`, `sponsor`)
- `full_name` text not null
- `org` text null
- `status` text not null default `active` check in (`active`, `pending`, `suspended`)
- `created_at` timestamptz not null default `now()`

Member/sponsor tier, events, invoices, and leads tables arrive in their own phases.

## Auth Details

- Passwords hashed with `bcryptjs` (cost 10).
- JWT signed with `JWT_SECRET`, 7-day expiry, payload `{ sub: userId, role }`.
- Cookie: `hbba_token`, httpOnly, sameSite=lax, path=/, `secure` when `NODE_ENV=production`.
- Signup roles limited to `member` or `sponsor` (admin can never be self-created).
- Signup sets `status = active` in Phase 1 so the flow is testable now; Phase 5
  (payments) introduces the `pending → active` gate without reworking this code.
- Email uniqueness enforced by the DB; duplicate signup returns 409.
- Validation: valid email, password length ≥ 8, non-empty name, role in allowed set.
  Invalid input returns 400 with a message. Generic 401 on bad login (no user
  enumeration).

## Seed Data

A seed script inserts three demo accounts so the existing demo-login buttons work
against real auth:
- `admin@hbbaglobal.co.uk` — role admin
- `member@hbbaglobal.co.uk` — role member
- `sponsor@hbbaglobal.co.uk` — role sponsor

All with password `hbbaglobal` (dev only). Seed is idempotent (upsert by email).

## Frontend Changes

- Boot calls `GET /api/me`; if authenticated, show that role's portal; else show login.
- Login form → `POST /api/auth/login`; on success, load `/api/me` and enter the app.
- Signup form gains an **Account type** select (Member / Sponsor) → `POST /api/auth/signup`;
  on success the user is logged in and enters their portal.
- Logout → `POST /api/auth/logout` → return to login.
- Role and identity come from `/api/me` (the existing email-guess + localStorage role
  is removed). The `ROLES` map still supplies nav, labels, and the stock avatar; the
  displayed name/email come from the logged-in user.
- Demo-login buttons fill email **and** password for the seeded accounts.

## Project Layout

```
server/
  index.js        app entry (start server)
  app.js          express app (exported for tests)
  db.js           pg Pool + query helper
  auth.js         hashing, JWT, cookie, middleware
  routes/auth.js  signup / login / logout / me
migrations/
  001_users.sql
  run.js          migration runner (tracks schema_migrations)
seed.js           demo accounts
docker-compose.yml  postgres service
.env.example
test/
  auth.test.js    node:test integration tests
package.json
```

The existing `index.html`, `app.js` (frontend), `styles.css`, `logo.svg`, and PDFs
stay at the project root and are served statically. The frontend `app.js` is distinct
from the server's `server/app.js`.

## Error Handling

- DB unavailable at boot → log clear error, exit non-zero.
- Duplicate email → 409; bad credentials → 401; invalid body → 400.
- Unexpected errors → 500 with a generic message; details logged, never leaked.
- Auth middleware: missing/invalid/expired token → 401.

## Testing

`node:test` integration tests run the Express app against a Postgres test database
(`DATABASE_URL` pointing at the Docker instance), using `fetch`:
- signup creates a user and sets a cookie; `/api/me` then returns that user
- duplicate email → 409
- login with correct/incorrect password → 200 / 401
- `/api/me` without cookie → 401; with cookie → the user
- signup cannot create an `admin`
- logout clears the cookie; subsequent `/api/me` → 401

Tests create and tear down their own rows; run against the dev DB started by
`docker compose up`.

## Out of Scope (later phases)

DB-backed page data (members/events/invoices/leads), Stripe payments, real email,
password reset, admin CRUD, production deployment hardening, rate limiting.

## Success Criteria

- `docker compose up -d` + `npm run migrate` + `npm run seed` + `npm start` brings up
  a working app on `http://localhost:3000`.
- Real signup and login work; refresh stays logged in; logout works.
- Role is enforced and supplied by the server; the three portals render as before.
- API tests pass.
