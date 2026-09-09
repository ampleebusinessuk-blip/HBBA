# HBBA Global — codebase reference

Every file, table, endpoint and UI mechanism in the portal, and why each one is
built the way it is. Read top to bottom the first time; after that use it as a
lookup.

- **Stack:** Node.js 24 (ESM), Express 4, PostgreSQL (Neon in production), plain
  HTML/CSS/JS frontend — no build step, no framework, no bundler.
- **Deployment:** one Vercel serverless function running the whole Express app,
  plus `public/` served straight from the CDN.
- **Size:** ~9,100 lines. 2,764 frontend JS · 2,195 CSS · ~2,000 server JS ·
  ~800 tests · 13 SQL migrations.

---

## 1. How a request flows

```
Browser
  │
  ├── GET /            → CDN serves public/index.html (never touches the function)
  ├── GET /app.js      → CDN
  │
  └── /api/*           → vercel.json rewrite → api/index.js → Express
                             │
                             ├── stripeRouter        (raw body, before JSON parsing)
                             ├── express.json        (256 kb limit)
                             ├── cookieParser
                             ├── security headers
                             ├── attachUser          (decodes the JWT cookie → req.auth)
                             ├── GET /api/health
                             ├── rate limit          (240/min per IP across /api)
                             ├── opsRouter           (migrate; token-gated)
                             ├── /api/auth + limiter (30/min)
                             ├── invoicesRouter ─┐
                             ├── supportRouter   ├── all requireAuth
                             ├── crmRouter       │
                             ├── dataRouter     ─┘
                             ├── /api/* 404 as JSON
                             └── static + SPA fallback (local dev only)
```

**Middleware order is load-bearing, not cosmetic.** Three bugs came out of it:

1. `stripeRouter` must precede `express.json`. Stripe signs the *raw* bytes; once
   a JSON parser has consumed the stream the signature can no longer be checked.
2. `opsRouter` must precede `crmRouter`/`dataRouter`. Those routers call
   `requireAuth` on every path under `/api`, so a later route answers `401`
   instead of running — which is exactly what happened to `/api/auth/forgot`
   before it was moved.
3. Anything mounted at `/api` with a blanket `requireAuth` shadows every
   unauthenticated route mounted after it.

---

## 2. Server files

### `api/index.js` (5 lines)
The Vercel entry point. Imports `createApp()` and exports the Express app as the
function handler. An Express app *is* a `(req, res)` function, so no adapter is
needed.

### `server/app.js` (86 lines)
Builds the app: security headers, the in-memory rate limiter, router mounting in
the order above, a JSON 404 for unknown `/api` paths, static file serving, the
SPA fallback, and the error handler.

The rate limiter is a `Map` of IP → `{count, reset}`. It is per-instance, so with
several warm function instances the effective limit is a multiple of the
configured one. It blunts brute force; it is not a distributed quota. Swap in a
shared store if that matters.

### `server/config.js` (39 lines)
`getRuntimeConfig(env)` — the single place environment turns into settings, and
the production guard rail. In production it **throws** when:

- `DATABASE_URL` is missing,
- `JWT_SECRET` is still `dev-only-change-me` or shorter than 32 characters,
- `DATABASE_URL` points at localhost.

Failing to boot is deliberate: a portal that silently runs on a dev secret is
worse than one that refuses to start. It also builds the pg pool options —
`connectionTimeoutMillis` is 12 s because Neon cold starts routinely exceed 3 s.

### `server/db.js` (31 lines)
One `pg.Pool`, cached on `globalThis` so a reused Vercel instance does not open a
new pool per invocation. Exports `query()` and `closePool()`.

### `server/auth.js` (65 lines)
- `hashPassword` / `verifyPassword` — bcrypt, 10 rounds.
- `signToken` / `verifyToken` — JWT carrying `{ sub: userId, role }`, 7-day TTL.
- `setAuthCookie(res, token, { remember })` — httpOnly, `sameSite=lax`, `secure`
  in production. With `remember: false` it omits `maxAge`, producing a session
  cookie that dies with the browser. That is the entire "Remember me" feature.
- `attachUser` — decodes the cookie into `req.auth` for every request, never rejects.
- `requireAuth` — 401 when `req.auth` is absent.
- `requireRole(...roles)` — 401 when signed out, 403 when the role is wrong.

The role lives in the signed token, so a client cannot promote itself; every
admin route re-checks server-side.

### `server/tokens.js` (34 lines)
Single-use links for password resets (60 min) and invites (7 days). Only the
SHA-256 **hash** of the token is stored, so a database leak does not yield usable
links. `findLiveToken` filters on `used_at IS NULL AND expires_at > now()`;
`consumeToken` burns it.

### `server/email.js` (112 lines)
Resend over plain REST — no SDK. `emailConfigured()` is the master switch.

Every attempt is written to `email_log` (`sent`, `skipped` or `failed`), so the
UI can state the truth rather than claim delivery. `sendEmail` never throws: a
mail failure must not roll back the business action that triggered it.
`sendBulk` walks recipients sequentially and returns counts;
`deliverySummary()` turns those into the sentence shown in toasts.

### `server/google.js` (54 lines)
OAuth 2.0 authorization-code flow, no SDK. Dormant until `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are set — and the UI hides the button by asking
`/api/auth/providers` first, so a button never appears that cannot work.

### `server/payments.js` (44 lines)
Stripe Checkout session creation over REST. `paymentsConfigured()` gates it.
Line items are built from the invoice's own currency and amount.

### `server/demo.js` (21 lines)
The demo switch. `demoPayments(configured)` and `demoEmail(configured)` return
true only when the real provider is **absent** and `DEMO_MODE` is not `0`. Real
credentials always win over the demo path.

### `server/activity.js` (44 lines)
One feed backs both the dashboard "Recent activity" panel and the notification
bell. `logActivity()` swallows its own errors — a log write must never break a
request. `feedFor(userId, role)` returns rows addressed to that user directly or
broadcast to their role, with an `unread` flag from the `activity_reads`
left-join. `markFeedRead` inserts read receipts.

### `server/eventbrite.js` (94 lines)
Two-way event sync. Dormant without `EVENTBRITE_TOKEN` + `EVENTBRITE_ORG_ID`.

### `server/admin-bootstrap.js` (39 lines) and `scripts/bootstrap-admin.js`
Creates the first admin from environment variables, validating the email,
rejecting passwords under 12 characters, and refusing the demo password in
production.

---

## 3. Routers

79 endpoints. Everything under `/api` requires a session except `/api/health`,
the auth endpoints, and the two token-gated ops/webhook routes.

### `server/routes/auth.js` (197 lines)
`POST /signup` · `POST /login` · `POST /logout` · `GET /me` ·
`POST /forgot` · `POST /reset` · `GET /providers` · `GET /google` ·
`GET /google/callback`

Details worth knowing:
- Signup accepts `member` or `sponsor` only — you cannot self-register as admin.
- Login returns the same 401 for an unknown email and a wrong password, so the
  form cannot be used to enumerate accounts. Suspended accounts get a distinct 403.
- `/forgot` **always** answers 200 with the same message, for the same reason.
  When email is not connected it also logs an admin-visible activity entry.
- `/reset` accepts invite tokens too, flipping a `pending` account to `active`.
- The Google callback checks a `state` cookie against the query parameter (CSRF),
  creates a member account on first sign-in, and refuses suspended users.

### `server/routes/data.js` (775 lines) — the largest router
Events and bookings, the member's own view, the sponsor portal, and most of the
admin desk.

- **Events:** list with per-user booking state and live attendee counts; book;
  cancel; admin create/update/cancel. Cancelling an event notifies every ticket
  holder individually through the activity feed.
- **Member:** `/me/bookings`, `/me/invoices`, `/me/membership` (real tier, price
  and renewal date from the user's own row joined to `membership_tiers`),
  `/me/membership/upgrade` (records a request for an admin to action),
  `/me/profile`.
- **Sponsor:** package overview, leads, sponsored events, and `/sponsor/charts`
  (leads per month over 12 months, attendee reach per sponsored event).
- **Admin:** org stats, members, sponsors, charts, users (invite/suspend/remove/
  set tier/issue reset link), integrations status, the ticket desk (issue,
  check in, refund), deals, tasks, sponsor contracts, Eventbrite sync.

`range` on `/admin/stats` and `/admin/charts` narrows every figure to a window in
days, which is what the dashboard's date-range control drives.

### `server/routes/crm.js` (443 lines)
Contacts (CRUD plus interaction logging that moves "last activity"),
memberships (tiers, renewals, reminders), campaigns (audience sizes from live
queries, send), networking introductions, the notification feed, and the outbox.

Audience segments are SQL, not stored lists — "Expiring soon" is
`renews_on <= CURRENT_DATE + 30 days` evaluated at send time.

### `server/routes/invoices.js` (273 lines)
Line items, VAT, lifecycle (`draft → sent → due → overdue → paid`, plus `void`),
a printable branded document, reminders that email the client, Stripe checkout,
and the demo settlement path. `effectiveStatus()` derives *overdue* from the due
date rather than storing it, so it is always current.

### `server/routes/support.js` (110 lines)
Tickets and threaded messages. Admins see everything, members and sponsors see
their own. An admin reply moves a ticket to `pending`.

### `server/routes/stripe.js` (75 lines)
`POST /stripe/webhook`. Verifies Stripe's `t=…,v1=…` header by recomputing
HMAC-SHA256 over `timestamp.rawBody`, compares in constant time, and rejects
timestamps older than five minutes (replay protection). `settleInvoice()` uses
`WHERE status <> 'paid'`, so a duplicate delivery cannot pay an invoice twice.

### `server/routes/ops.js` (33 lines)
`POST /ops/migrate`. Exists because Vercel marks the production `DATABASE_URL`
as sensitive — it cannot be pulled to a workstation, so the deployment migrates
its own database. Gated on `MIGRATE_TOKEN`: **unset, the route returns 404 and
does not exist.** The token is compared with `timingSafeEqual`.

---

## 4. Data model (21 tables)

| Table | Holds | Notes |
|---|---|---|
| `users` | accounts | `role` admin/member/sponsor, `status` active/pending/suspended, `tier`, `renews_on`, `nudged_at` |
| `events` | events | `code` is the public id; `source` local or eventbrite; `status` includes `Cancelled` |
| `event_bookings` | tickets | unique per (user, event); `checked_in` + `checked_in_at`; `status` carries `Refunded` |
| `invoices` | billing | `subtotal_cents`, `tax_cents`, `vat_rate`, `due_on`, `reminder_count`, `paid_at`, `payment_ref` |
| `invoice_items` | line items | ordered by `sort` |
| `sponsorships` | sponsor packages | `inclusions` jsonb, brand metrics |
| `sponsor_leads`, `sponsored_events` | sponsor portal data | |
| `contacts` | CRM | `status` Active/Warm/New/Cold, `last_activity_at` |
| `deals` | pipeline | `stage` lead/qualified/proposal/won/lost |
| `tasks` | kanban | `status` todo/doing/done |
| `support_tickets`, `support_messages` | helpdesk | |
| `membership_tiers` | tier reference | `perks` jsonb |
| `campaigns` | email marketing | counters for sent/open/click |
| `intro_requests` | networking | pending/matched/declined |
| `activity_log`, `activity_reads` | feed + read receipts | one feed, two views |
| `email_log` | every send attempt | sent/skipped/failed |
| `password_resets` | reset + invite tokens | stores the hash only |
| `schema_migrations` | applied migrations | |

Money is always **integer pence** (`*_cents`). No floats touch currency.

---

## 5. Frontend (`public/app.js`, 2,764 lines)

No framework. The whole UI is string templates plus one delegated event listener.

**Shape:**

1. **Icons and helpers** — inline SVG, `statusPill`, `emptyState`, `filterBar`,
   `pagination`, `lineChart`, `realBars`, `donut`.
2. **State** — module-level `let` bindings (`events`, `invoices`, `contacts`,
   `products`…). Every one starts **empty** and is filled by a loader. There is
   no mock data anywhere in this file; if the API returns nothing, the page shows
   an empty state.
3. **Loaders** — `loadAdminData`, `loadMemberData`, `loadSponsorData`,
   `loadNotifications`, `loadNetworking`. Each fires its requests with
   `Promise.all` and assigns only on `ok`.
4. **Page renderers** — one function per page returning an HTML string. The
   router picks from `pageRenderers` (admin) or `roleRenderers[role]`.
5. **Actions** — one async function per write (`createContact`, `issueTicket`,
   `refundTicket`, …). Each posts, toasts the real server message, reloads, and
   re-renders.
6. **The dispatcher** — a single `click` listener on `document.body` that matches
   `data-*` attributes. This is why every interactive element carries a
   `data-something` hook, and why a button *without* one is a bug: the dispatcher
   has a catch-all that says "Not available yet" rather than failing silently.

**Two subtle traps already hit and fixed here:**

- An inline `onclick="event.stopPropagation()"` prevents the delegated listener
  from ever seeing the click. It silently broke Book and Cancel on the member
  events page.
- Rendering `<img src="${e.img}">` when `img` is null produces a literal request
  for `/null`. Use the `eventImage()` helper.

**Filtering** (`filterVisibleRows`) matches on a row clone with buttons removed —
otherwise a "Mark paid" button makes every invoice match the search "paid".

---

## 6. Security model

| Concern | Handling |
|---|---|
| Passwords | bcrypt, 10 rounds, never logged or returned |
| Sessions | httpOnly JWT cookie, `sameSite=lax`, `secure` in production, 7-day TTL |
| Authorisation | role in the signed token, re-checked per route by `requireRole` |
| Account enumeration | identical responses for unknown vs wrong on login and forgot-password |
| Reset tokens | hashed at rest, single-use, time-boxed |
| Brute force | 30 requests/min on `/api/auth`, 240/min across `/api` |
| Stripe | HMAC signature over the raw body, constant-time compare, 5-minute replay window |
| Ops endpoint | 404 unless `MIGRATE_TOKEN` is set; constant-time compare |
| Headers | `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, HSTS, restrictive `Permissions-Policy` |
| Config | production refuses to boot on a dev secret or a localhost database |

**Still open:** the seeded admin account `admin@hbbaglobal.co.uk` retains the
password that used to be published in the README. Rotate it.

---

## 7. Integrations

Each is dormant until its keys exist, and Settings → Integrations shows live
status for every one.

| Service | Env | Off behaviour |
|---|---|---|
| Resend (email) | `RESEND_API_KEY`, `EMAIL_FROM` | queued to the in-app outbox, never delivered |
| Stripe | `STRIPE_SECRET_KEY` | demo settlement, labelled, `demo-` payment ref |
| Stripe webhook | `STRIPE_WEBHOOK_SECRET` | endpoint returns 503 |
| Google sign-in | `GOOGLE_CLIENT_ID/SECRET` | button hidden |
| Eventbrite | `EVENTBRITE_TOKEN`, `EVENTBRITE_ORG_ID` | sync returns a clear 400 |
| Demo mode | `DEMO_MODE=0` disables | demo paths off entirely |

---

## 8. Migrations and deployment

`migrations/run.js` exports `runMigrations()` and doubles as the `npm run migrate`
CLI. It takes a Postgres **advisory lock** so a CLI run and a deployment run can
never apply the same file twice, applies each `.sql` in a transaction, and
records it in `schema_migrations`.

`vercel.json` sets `outputDirectory: public`, declares the function with
`maxDuration: 30`, and — critically — `includeFiles: "migrations/**"`. Without
that the `.sql` files are not traced into the bundle and the migrate endpoint
reports "up to date" against a database that is behind.

**Deploying:** `vercel --prod`. **Migrating production:** add `MIGRATE_TOKEN`,
deploy, `POST /api/ops/migrate` with the token, remove the variable, redeploy.

---

## 9. Tests (50, `npm test`)

`node:test`, no framework. Real HTTP against a real Express app and a real
Postgres — no mocks of our own code.

| File | Covers |
|---|---|
| `config.test.js` | production guards (no database needed) |
| `admin-bootstrap.test.js` | first-admin validation (no database needed) |
| `auth.test.js` | signup, login, cookies, role protection |
| `auth-flows.test.js` | reset tokens, remember-me, suspension, providers, Google URL, invites, email logging, Stripe signature and settlement |
| `data.test.js` | member/sponsor/admin endpoint smoke |
| `crm.test.js` | contacts, memberships, campaigns, networking, ticket desk, activity |
| `demo-mode.test.js` | demo payment, double-settlement, ownership, kill switch, real-keys precedence, outbox |
| `ops.test.js` | migrate endpoint gating and idempotency |

CI (`.github/workflows/ci.yml`) runs migrations and the suite against a Postgres
service on every push and PR.

---

## 10. What still needs your content

Nothing in the database is invented any more. These are structural placeholders
waiting on real values:

1. **Membership tiers** — Gold / Silver / Bronze exist with £0 and no benefits.
   Set them in Memberships → Manage tier.
2. **The admin password** — rotate `admin@hbbaglobal.co.uk`.
3. **Sponsor packages** — tier cards summarise real contracts; inclusions come
   from each sponsorship row as you create it.
4. **Events, members, sponsors, invoices** — all empty by design after the
   clear-out. Everything you add from here is real.
