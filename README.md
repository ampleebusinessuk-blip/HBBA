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
- **Email** — invites, resets, reminders and campaigns queue into an in-app
  outbox (Email Marketing -> Outbox) instead of being delivered.

Connecting a real provider switches that capability to the real path
automatically; a demo settlement is refused once `STRIPE_SECRET_KEY` is set.
Set `DEMO_MODE=0` to turn the demo paths off entirely: payments then return
`503` and email is only recorded.

## Optional Integrations

Each one is dormant until its keys are set, and Settings -> Integrations shows
the live status of every row:

- `RESEND_API_KEY` (+ `EMAIL_FROM`): delivers invites, password resets, invoice
  reminders and campaigns. Without it those actions are still recorded in
  `email_log` with status `skipped`, and the UI says so.
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
- Create a campaign and send it to a real audience.
- Edit a membership tier and send renewal reminders.
- Issue and refund a ticket.
- Create, remind and pay an invoice.
- Request an introduction as a member and match it as admin.
- Invite, suspend and remove a user from Settings → Team.
- Confirm a member gets `403` from `/api/admin/stats`.

Email delivery is recorded but not sent until `RESEND_API_KEY` is set; card
payments need Stripe keys. Both surfaces say so in the UI rather than pretending
to have sent something.
