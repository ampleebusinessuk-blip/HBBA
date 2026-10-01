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

### `server/invoicing.js` (195 lines)
The arithmetic an invoice depends on, kept away from HTTP so it can be checked
on its own. `calculateTotals()` fixes the order of operations: line totals,
then the discount, then VAT **on the discounted amount**, then anything already
paid. Charging VAT on money the client is not being asked for would overstate
the tax, so the order is the point of the function.

`toCents()` rounds through integers rather than trusting a float (`19.99 * 100`
is `1998.9999…` in binary). `splitInstallments()` gives the remainder to the
first part, so the parts always add back to the whole.

Dates are handled as calendar dates, never timestamps: `asDateOnly()` and
`nextOccurrence()` work on three numbers. Stepping a `Date` by a month lands a
day early whenever the step crosses a daylight-saving boundary — the clock moved
but the calendar did not — and a 31st is pulled back to the last day of a
shorter month rather than overflowing into the next one.

`newPublicToken()` is 24 random bytes, base64url. It carries nothing about the
invoice it opens.

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

### `server/campaigns.js`
The campaign delivery service — audience resolution, validation and delivery
state, kept out of the HTTP layer so the admin "Send now" button and the cron
worker share one implementation.

- `validateCampaignInput` rejects missing content, an unpaired call to action, a
  non-https CTA outside development, and a send time in the past. It runs before
  any INSERT, so a rejected campaign leaves nothing behind.
- `campaignAudience` repeats `marketing_opt_in = true` in every segment branch,
  normalises with `lower(trim(email))` and de-duplicates, so an address held as
  both a user and a contact receives one message.
- `deliverCampaign` claims a campaign with a single conditional UPDATE. The row
  is locked for that statement and the status predicate excludes anything
  already `Sending`, which is what makes two racing workers safe without an
  explicit transaction. Recipients are upserted on `(campaign_id, email)`,
  keeping existing tokens and delivery state, and only rows that are not already
  `sent` are processed — that is why a retry contacts failures alone.
- Terminal state comes from the recipient rows: `Sent`, `Partially sent` or
  `Failed`. Audience size is never reported as delivery.

### `server/routes/campaigns-public.js`
Open tracking, click tracking and unsubscribe — the only campaign routes
reachable without a session, because they are opened from an email client. They
are mounted ahead of every authenticated router. Opens and clicks use
`COALESCE(column, now())` so repeated events never move the first-event time,
the click endpoint redirects only to the CTA stored on the campaign, and known,
unknown and malformed tokens all get the same answer.

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

### `server/routes/invoices.js` (789 lines)
The whole billing surface. Lifecycle is `draft → sent → due → overdue → paid`,
plus `void`; `effectiveStatus()` derives *overdue* from the due date rather than
storing it, so it is always current.

`invoiceDocument(row)` assembles everything the printed document needs in one
place — who is billing (from the business profile), who is billed (the client
record, or the user, or a typed name), the lines with their units and detail,
the totals, the bank account, the payment schedule and the signature. It also
returns an `edit` block carrying the **raw** values (client id, bank account id,
discount type and value, pence): the printed figures are formatted strings, and
without the raw ones reopening an invoice in the builder would silently drop its
client, its bank account and its discount.

`copyInvoice()` duplicates an invoice and its lines, and is used by both the
Duplicate button and the recurring schedule, so a repeat is identical to a
hand-made copy. A copy always gets a **new** share token and a zero advance — it
is a fresh claim, not a second claim on money already collected.

`runRecurringInvoices()` is driven by the daily cron. It selects every schedule
whose date has arrived, including ones already past their end date: those are
retired rather than left behind as a schedule that can never fire again.

**`publicInvoiceRouter`** is exported separately and mounted *ahead* of every
router that requires a session, because the person opening the link has no
account. The token is the whole credential, so it is long, random, revocable by
rotation, and dead the moment the invoice is voided. Acceptance
(`POST /public/invoices/:token/sign`) records a name, a time and the address it
came from, exactly once — a signature that could be overwritten would be worth
nothing. Card payment from the link is refused unless it was switched on for
that specific invoice.

### `server/routes/clients.js` (113 lines)
The companies you bill. Until this existed an invoice could only be addressed to
a portal user, so a company that never logs in could not be billed at all.
Guarded by `requirePermission('invoices.manage', 'crm.manage')`. A client is
linked to a portal account only by an exact email match, and deleting one that
has invoices is refused with a count rather than cascading.

### `server/routes/profile.js` (140 lines)
Self-service profiles for every role: name, picture, job title, phone, city,
website, bio, and a password change that requires the current password so a
borrowed session cannot lock the owner out. Role, status, permissions and email
are deliberately not writable here — those belong to an administrator.

The avatar is stored on the row as a data URL, not on disk: a container
filesystem does not survive a redeploy, and a picture that vanishes on deploy is
worse than none. The upload is re-encoded from the decoded bytes and checked
against a declared image type, so only an actual JPEG, PNG or WebP can be
stored. The browser crops to a centred square and resizes to 256px before
sending, which keeps a phone photo well inside the request limit.

### `server/routes/support.js` (110 lines)
Tickets and threaded messages. Admins see everything, members and sponsors see
their own. An admin reply moves a ticket to `pending`.

### `server/routes/stripe.js` (75 lines)
`POST /stripe/webhook`. Verifies Stripe's `t=…,v1=…` header by recomputing
HMAC-SHA256 over `timestamp.rawBody`, compares in constant time, and rejects
timestamps older than five minutes (replay protection). `settleInvoice()` uses
`WHERE status <> 'paid'`, so a duplicate delivery cannot pay an invoice twice.

### `server/routes/ops.js`
`POST /ops/migrate`. Exists because Vercel marks the production `DATABASE_URL`
as sensitive — it cannot be pulled to a workstation, so the deployment migrates
its own database. Gated on `MIGRATE_TOKEN`: **unset, the route returns 404 and
does not exist.** The token is compared with `timingSafeEqual`.

`GET /ops/campaigns/run` is the daily cron. One tick both delivers due
campaigns and issues due recurring invoices, because Vercel's Hobby plan allows
exactly one schedule.

---

## 4. Data model (24 tables)

| Table | Holds | Notes |
|---|---|---|
| `users` | accounts | `role` admin/member/sponsor, `status` active/pending/suspended, `tier`, `renews_on`, `nudged_at`, `marketing_opt_in` (+ opted in/out timestamps), `permissions` jsonb, and the self-maintained profile: `avatar_data`, `job_title`, `phone`, `city`, `website`, `bio` |
| `clients` | the companies you bill | no portal account required; `user_id` links one only when the email matches exactly |
| `events` | events | `code` is the public id; `source` local or eventbrite; `status` includes `Cancelled` |
| `event_bookings` | tickets | unique per (user, event); `checked_in` + `checked_in_at`; `status` carries `Refunded` |
| `invoices` | billing | `subtotal_cents`, `tax_cents`, `vat_rate`, `due_on`, `reminder_count`, `paid_at`, `payment_ref`; the document (`client_id`, `document_title`, `header_color`, `po_ref`, `service_category`, `location_mode`, `delivery_period`, `bank_account_id`); money off and money in (`discount_type`/`discount_value`/`discount_cents`, `advance_paid_cents`); the shared link (`public_token`, unique where not null, `allow_card_payment`); acceptance (`signed_name`/`signed_at`/`signed_ip`); repeats (`recurring_interval`, `recurring_next_on`, `recurring_until`, `recurring_parent_id`) |
| `invoice_items` | line items | ordered by `sort`; `unit` is the noun on the line ("Hour"), `unit_cents` its price, `details` an optional second line |
| `invoice_installments` | payment schedule | `label`, `due_on`, `amount_cents`, `status` due/paid; settling the last one settles the invoice |
| `app_settings` | workspace settings and encrypted credentials | secrets are AES-256-GCM; env vars always win |
| `bank_accounts` | where invoices are paid | a partial unique index keeps exactly one default |
| `sponsorships` | sponsor packages | `inclusions` jsonb, brand metrics |
| `sponsor_leads`, `sponsored_events` | sponsor portal data | |
| `contacts` | CRM | `status` Active/Warm/New/Cold, `last_activity_at`, `marketing_opt_in` (+ opted in/out timestamps) |
| `deals` | pipeline | `stage` lead/qualified/proposal/won/lost |
| `tasks` | kanban | `status` todo/doing/done |
| `support_tickets`, `support_messages` | helpdesk | |
| `membership_tiers` | tier reference | `perks` jsonb |
| `campaigns` | email marketing | authored body/CTA, delivery timings, `failed_count`, `last_error`; status Draft/Scheduled/Sending/Sent/Partially sent/Failed |
| `campaign_recipients` | one row per campaign and address | opaque `public_token`, `delivery_status`, provider id, first open/click; unique `(campaign_id, email)` is what makes delivery idempotent |
| `intro_requests` | networking | pending/matched/declined |
| `activity_log`, `activity_reads` | feed + read receipts | one feed, two views |
| `email_log` | every send attempt | sent/skipped/failed |
| `password_resets` | reset + invite tokens | stores the hash only |
| `schema_migrations` | applied migrations | |

Money is always **integer pence** (`*_cents`). No floats touch currency.

---

## 5. Frontend (`public/app.js`, 3,902 lines; `public/invoice.html`, 278 lines)

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

**Identity.** The header renders the person actually signed in — their own name,
their own picture, and the job title they gave themselves. Somebody who has not
uploaded a picture gets their initials (`personAvatar`), never a stock photo of
a stranger. `h()` HTML-escapes everything a person typed about themselves, so a
name containing a tag stays a name.

**The invoice builder** (`invoiceBuilderPage`) is a page, not a modal: form on
the left, the document's figures on the right. `draftTotals()` mirrors the
server's order of operations exactly, so the preview is what will be stored — and
it prints with `fmtPence()` rather than `fmtMoney()`, because a preview that
rounds away the pence is a preview that lies.

While typing, only the preview is repainted (`repaintPreview`), so no field
loses focus; a control that reveals another field (the discount type, the repeat
interval, the split toggle) redraws the form instead.

**`public/invoice.html`** is a standalone page with no dependency on `app.js`.
The token lives in the URL **fragment**, so it is never sent in a request line
or a referrer header. It renders the document, offers print/save-as-PDF,
acceptance by typed name, and card payment when the invoice allows it — and in
demo mode it says in words that no card is charged before anything is recorded.

---

## 6. Security model

### Roles and delegated permissions

A role answers "what kind of account is this"; a permission answers "what may
this particular account do beyond its own portal". `server/permissions.js`
defines eleven grantable capabilities — `crm.manage`, `events.manage`,
`tickets.manage`, `memberships.manage`, `sponsors.manage`, `campaigns.manage`,
`invoices.manage`, `support.manage`, `tasks.manage`, `networking.manage`,
`reports.view`.

An administrator holds all of them by role, so granting only ever concerns
members and sponsors. `requirePermission()` re-reads the grant from the database
on every request rather than trusting the token, so a revocation takes effect on
the next call instead of when a cookie happens to expire — and a suspended
account holds nothing regardless of what it was granted. Unknown capability
names are discarded rather than stored.

The frontend mirrors this for rendering only: `/api/auth/me` returns the held
capabilities, the sidebar gains the matching admin pages, and the loader fetches
only the endpoints that session may read. Every one of those endpoints still
checks server-side.

| Concern | Handling |
|---|---|
| Passwords | bcrypt, 10 rounds, never logged or returned |
| Sessions | httpOnly JWT cookie, `sameSite=lax`, `secure` in production, 7-day TTL |
| Authorisation | role in the signed token, re-checked per route by `requireRole`; delegated capabilities re-read from the database per request by `requirePermission` |
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
status for every one. Every key here can also be set from the UI instead of the
environment: `server/settings.js` encrypts credentials with AES-256-GCM under
`SECRETS_KEY`, masks them on the way back out (`re_••••7890`), and lets an
environment variable always win — which also locks the field in the UI, so the
two can never disagree. `SECRETS_KEY` must stay paired with its database, or
stored credentials become unreadable.

`EMAIL_TRANSPORT` chooses between SMTP and Resend; left unset, whichever is
configured is used, SMTP first. Settings → Integrations has a test-send that
verifies the transport and then reports the mail server's own error verbatim
rather than a generic failure.

| Service | Env | Off behaviour |
|---|---|---|
| Email — SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` | queued to the in-app outbox, never delivered |
| Email — Resend | `RESEND_API_KEY`, `EMAIL_FROM` | queued to the in-app outbox, never delivered |
| Stripe | `STRIPE_SECRET_KEY` | demo settlement, labelled, `demo-` payment ref |
| Stripe webhook | `STRIPE_WEBHOOK_SECRET` | endpoint returns 503 |
| Daily cron (campaigns + recurring invoices) | `CRON_SECRET` | `/api/ops/campaigns/run` returns 404, so nothing is delivered and no repeat is issued. Runs daily on Hobby; Vercel rejects sub-daily crons on that plan. |
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

## 9. Tests (172 Node, 10 browser)

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
| `campaign-schema.test.js` | consent columns, status constraint, recipient uniqueness and cascade |
| `campaign-service.test.js` | validation, consent-filtered audience, delivery, partial retry, empty audience, scheduling, races |
| `campaign-public.test.js` | open/click idempotence, redirect safety, multi-record unsubscribe, token neutrality |
| `campaign-api.test.js` | consent persistence, campaign CRUD, truthful send outcomes, cron auth and claiming |
| `campaign-interface.test.js` | frontend contract: authoring hooks, consent controls, truthful reporting |
| `permissions.test.js` | delegated capabilities: granting, revocation taking effect on the next request, suspension, invented keys, admin exemption |
| `settings.test.js` | credentials usable but never readable, environment precedence and field locking, masking, bank-account default, SMTP vs Resend selection, test-send |
| `invoicing.test.js` | the arithmetic, with no database: pence rounding, VAT after discount, advance capping, installment remainders, DST-safe month stepping, month-end clamping, validation messages |
| `invoices-api.test.js` | billing a company with no account, the printed document, re-lining, the shared link (open, rotate, revoke, void), acceptance recorded once, card payment gated per invoice, schedules, repeats retiring themselves, copies, round-trip fidelity of an edit |
| `profile.test.js` | every role has a profile, what is and is not writable from it, picture type/size validation, password change needing the current one |

Test files run one at a time (`--test-concurrency=1`): they share a single
database, and parallel files were changing each other's campaign audiences.

`npm run test:browser` runs the Playwright suite in `e2e/`, which boots the real
Express app on an ephemeral port and drives a real browser:

- `campaign-browser.spec.js` — the campaign lifecycle, viewport overflow at
  1440px and 390px, and unsubscribe from the link in an email.
- `invoicing-browser.spec.js` — the header showing the person signed in rather
  than a stock photograph; changing one's own name and uploading a picture;
  composing an invoice and watching the figures track what is typed; opening the
  shared link in a **fresh browser context with no cookie at all** and accepting
  it; a rotated link going dead for whoever held the old one; reopening an
  invoice and finding everything still there; and a member granted
  `invoices.manage` getting those pages and nothing else.

Both specs assert that no console error or page error occurred, which is how a
button that looks like it works but does not gets caught.

They live outside `test/` because `node --test` treats every file in that
directory as a Node test. The connection pool is closed once in
`e2e/global-teardown.js`: Playwright runs every spec in one worker process, so a
spec closing the pool in its own teardown breaks whichever spec runs next.

CI (`.github/workflows/ci.yml`) runs migrations, the Node suite and the browser
suite against a Postgres service on every push and PR.

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
5. **Your business details** — Settings → Business fills the "billed by" block
   on every invoice: name, address, company number, VAT number, invoice prefix
   and footer. Until it is filled, invoices print with the defaults.
6. **A bank account** — Settings → Business → Bank accounts. An invoice with no
   bank account tells the client so instead of printing a blank panel, but they
   will have no way to pay by transfer.
