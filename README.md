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

`npm run seed` loads demo fixtures for local work only: it refuses to run
unless `DATABASE_URL` points at localhost. It creates three throwaway accounts
(`admin@`, `member@` and `sponsor@hbbaglobal.co.uk`) sharing the password in
`seed.js`. Never run it against a deployed database, and never reuse those
credentials outside your machine.

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

## Demo Mode

While Stripe and Resend are not connected, the portal still demonstrates both
journeys end to end, and labels them everywhere:

- **Payments** — "Pay now" asks for confirmation ("no card is charged"), then
  marks the invoice paid with a `demo-` payment reference. The activity feed and
  the payer's notification both say `(demo)`.
- **Email** — invites, resets, reminders and campaign sends queue into an
  in-app outbox (Email Marketing -> Outbox) instead of being delivered. A
  campaign sent in this state is recorded as `Failed` with nothing delivered;
  it is never reported as sent.

Connecting a real provider switches that capability to the real path
automatically; a demo settlement is refused once `STRIPE_SECRET_KEY` is set.
Set `DEMO_MODE=0` to turn the demo paths off entirely: payments then return
`503` and email is only recorded.

## Email Campaigns

Campaigns are real email, not a demo surface. What that means operationally:

**Consent is explicit.** Everyone is opted out until an administrator ticks
`Marketing emails` on a contact or an invited user. Only opted-in records enter
a campaign audience, which is why the audience picker shows *eligible of total*.
Transactional email — password resets, invites, invoice reminders — is
unaffected by marketing consent and always sends.

**Authoring.** An administrator writes an internal name, a subject, a plain-text
message, and an optional call-to-action label and link. The server escapes the
message and wraps it in the branded template, so a campaign can never inject
markup. A call to action needs both its label and its link, and the link must be
`https` in production.

**Sending.** Leave the send time empty to save a draft you send by hand. Set a
future time to schedule it. Either way delivery runs through the same service:
it claims the campaign, resolves the consent-qualified audience, writes one
recipient row per address, and sends only to rows that are not already
delivered.

**Scheduling granularity follows the cron schedule.** Vercel Cron calls
`/api/ops/campaigns/run` on the schedule in `vercel.json`. A Hobby plan allows
only one run per day, so it is set to `0 8 * * *` and a campaign scheduled for
any time today goes out at the next 08:00 UTC run. Vercel Pro allows
`*/5 * * * *` for five-minute granularity; alternatively point any external
scheduler at the same endpoint with the `CRON_SECRET` bearer token. One
invocation handles at most five due campaigns.

Send by hand with **Send now** whenever you do not want to wait for the run.

**Outcomes are truthful.** A campaign finishes as `Sent` (everyone delivered),
`Partially sent` (some delivered, some did not) or `Failed` (nothing delivered).
Audience size is never reported as delivery. With no provider connected every
recipient is recorded as skipped and the campaign ends `Failed`.

**Retry sends to failures only.** `Retry failed` on a `Failed` or
`Partially sent` campaign re-runs delivery; addresses already delivered are
skipped, so nobody receives the message twice.

**Tracking is approximate.** Each recipient gets an opaque token. The open pixel
and the click link record only the *first* event per recipient, so counts are
distinct people rather than raw events. Open rates are labelled estimated
because many mail clients block images. The click endpoint redirects only to the
CTA stored on the campaign — it never takes a destination from the request.

**Unsubscribe.** Every campaign email carries a link to `/unsubscribe/:token`.
Confirming it opts out every user and contact record holding that address and
stamps the time. Known, unknown and malformed tokens get the same response, so
the endpoint cannot be used to test whether an address is on the list.

### Deploying campaigns

Order matters:

1. Apply migrations first. `campaign_recipients` and the consent columns must
   exist before the cron route runs, or every invocation errors.
2. Set `APP_URL` — tracking and unsubscribe links are built from it.
3. Set `CRON_SECRET`, then deploy so Vercel registers the schedule in
   `vercel.json`.
4. Set `RESEND_API_KEY` and `EMAIL_FROM` when you are ready to deliver.

### Campaign smoke checklist

- Tick `Marketing emails` on one contact; confirm the audience count rises by one.
- Create a campaign with a message and a CTA; confirm it saves as `Draft`.
- Send it; confirm the reported outcome matches what the provider actually did.
- With no provider connected, confirm the campaign reads `Failed`, delivered 0.
- Open the campaign email, click the CTA, and confirm the counts move once only.
- Follow the unsubscribe link; confirm the contact drops out of the audience.
- Schedule a campaign, then confirm the next cron run picks it up (or call
  `/api/ops/campaigns/run` with the bearer token to check without waiting).

## Optional Integrations

Each one is dormant until its keys are set, and Settings -> Integrations shows
the live status of every row:

- `RESEND_API_KEY` (+ `EMAIL_FROM`): delivers invites, password resets, invoice
  reminders and campaigns. Without it those actions are still recorded in
  `email_log` with status `skipped`, and the UI says so.
- `CRON_SECRET`: enables `GET /api/ops/campaigns/run`, the scheduled-campaign
  worker Vercel Cron calls on the schedule in `vercel.json`. Unset, that route returns 404.
- `STRIPE_SECRET_KEY`: enables the hosted checkout on an invoice.
- `STRIPE_WEBHOOK_SECRET`: lets `POST /api/stripe/webhook` mark an invoice paid
  when checkout completes. Point the Stripe endpoint at
  `https://<your-domain>/api/stripe/webhook` and subscribe to
  `checkout.session.completed`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: shows the "Continue with Google"
  button. Redirect URI defaults to `<APP_URL>/api/auth/google/callback`.
- `EVENTBRITE_TOKEN` / `EVENTBRITE_ORG_ID`: two-way event sync.
- `APP_URL`: the public URL used in email links and the OAuth redirect.

## Production Database

Run migrations against the production database before opening the app to users:

```powershell
$env:DATABASE_URL="postgres://..."
$env:JWT_SECRET="replace-with-at-least-32-random-characters"
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
- Log in as admin, member and sponsor.
- Sign up as a member or sponsor.
- Book an event as a member; check the member in from the admin ticket desk.
- Create, edit and cancel an event as admin.
- Add a CRM contact, log a call against it, then delete it.
- Opt a contact into marketing, then create a campaign and send it.
- Edit a membership tier and send renewal reminders.
- Issue and refund a ticket.
- Create, remind and pay an invoice.
- Request an introduction as a member and match it as admin.
- Invite, suspend and remove a user from Settings → Team.
- Confirm a member gets `403` from `/api/admin/stats`.

Email delivery is recorded but not sent until `RESEND_API_KEY` is set; card
payments need Stripe keys. Both surfaces say so in the UI rather than pretending
to have sent something.
