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
- Log in as admin.
- Log in as member.
- Log in as sponsor.
- Sign up as a member or sponsor.
- Book an event as a member.
- View invoices.
- Create an event as admin.
- Confirm a member gets `403` from `/api/admin/stats`.
