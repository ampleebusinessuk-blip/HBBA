# Live Production Readiness - Design Spec

**Date:** 2026-06-28
**Status:** Approved direction, pending written-spec review
**Scope:** Prepare the existing HBBA Express/Postgres app for live deployment on Vercel for real users.

## Goal

Make the current HBBA application safe and practical to hand to a client as a live production deployment. The work should keep the existing architecture: a vanilla frontend in `public/`, an Express API in `server/`, a Vercel serverless entry in `api/index.js`, and Postgres for persistent data.

Success means the app can be deployed to the already-linked Vercel project, configured with a production database and secrets, verified through the main role flows, and documented well enough for client handoff.

## Recommended Approach

Productionize the current app rather than rewriting it. This is the fastest reliable path because the repo already contains real auth, role-based portals, migrations, seed data, and Vercel routing.

The implementation will focus on reliability and handoff readiness:

- Clear production environment setup.
- Managed Postgres compatibility.
- Safe migration and seed workflow.
- Runtime checks that fail quickly when configuration is missing or invalid.
- Automated and manual verification for auth and core portal flows.
- Client-facing documentation that replaces prototype-era README content.

## Architecture

The runtime architecture remains:

```text
Browser
  -> Vercel static files from public/
  -> /api/* routed to api/index.js
  -> Express app from server/app.js
  -> Managed Postgres via DATABASE_URL
```

Local development continues to use `server/index.js` and Docker Postgres. Production uses `api/index.js` as a serverless function on Vercel.

## Production Configuration

Production requires these environment variables:

- `DATABASE_URL`: managed Postgres connection string.
- `JWT_SECRET`: long random secret, different from local development.
- `NODE_ENV=production`.

Optional local variables remain in `.env` and `.env.example`.

The app should guard against unsafe defaults in production. In production, startup/API initialization must not silently use `dev-only-change-me` or a localhost database URL.

## Database And Migrations

Migrations stay in `migrations/` and remain the source of truth for schema changes. Production deployment should include a documented manual step to run migrations against the production database before opening the app to real users.

Seed behavior should be separated by intent:

- Development seed data remains available for local testing and demo accounts.
- Production should not create weak demo accounts unless explicitly requested for a controlled launch/demo.
- A documented admin bootstrap path should exist so the client can get the first admin user without self-signup allowing admin creation.

## Auth And Security

The existing httpOnly JWT cookie model remains. Production hardening should include:

- Rejecting unsafe `JWT_SECRET` values in production.
- Keeping cookies `httpOnly`, `sameSite=lax`, and `secure` in production.
- Preserving server-side role enforcement for admin routes.
- Avoiding leakage of database errors or stack traces to users.

Additional security features such as password reset, MFA, payment gating, audit logging, and rate limiting are useful but out of scope for this readiness pass unless required to unblock deployment.

## Frontend Readiness

The frontend should feel like a real product, not a prototype handoff. Work should prioritize:

- Removing or replacing stale prototype copy in docs and visible UI where it affects trust.
- Fixing text encoding issues that show broken symbols for currency, arrows, quotation marks, or emoji.
- Ensuring login, signup, logout, role-specific navigation, event booking, invoices, sponsor views, and admin views work with API-backed data.
- Keeping visual changes conservative and aligned with the existing interface.

This pass should not redesign the app or rewrite the UI framework.

## Verification

Automated verification should cover:

- Health check returns success when the API is running.
- Auth signup/login/logout behavior.
- Authenticated `/api/auth/me`.
- Role protection for admin routes.
- Core data endpoints for member, sponsor, and admin roles.

The current test command timed out during exploration, likely because the database was unavailable or connection attempts had no fast failure. The implementation should make test failures actionable instead of hanging.

Manual production smoke checks should cover:

- Visiting the deployed site.
- Logging in as admin/member/sponsor.
- Signing up as member or sponsor.
- Booking an event as a member.
- Viewing invoices.
- Creating an event as admin.
- Confirming unauthorized users cannot access admin API routes.

## Deployment Flow

The repo is already linked to a Vercel project named `hbba`. The local Vercel CLI is currently not installed, so deployment can happen either by:

- Installing Vercel CLI with `npm i -g vercel`, then using `vercel pull`, `vercel env`, and `vercel --prod`.
- Connecting the repo to Vercel Git deployments and pushing the prepared branch.

The handoff documentation should describe both the required configuration and the final smoke-test checklist.

## Files Expected To Change

- `README.md`: replace prototype-only text with production setup, local setup, deploy, migration, and verification instructions.
- `.env.example`: clarify required local and production variables.
- `server/auth.js` and/or `server/db.js`: add production configuration guards and faster database failure behavior if needed.
- `migrations/`, `seed.js`, or a new bootstrap script: provide a safe first-admin path if existing seed behavior is not suitable for production.
- `test/`: add or adjust tests for production readiness and avoid hanging when DB is unavailable.
- `public/app.js` and/or `public/styles.css`: fix visible encoding/prototype polish issues where they affect client trust.

## Out Of Scope

- Rewriting the frontend in React or Next.js.
- Adding payments, subscriptions, or membership billing.
- Password reset, email sending, MFA, audit logs, and advanced admin CRUD beyond existing flows.
- Full observability stack.
- Data migration from an external legacy system.

## Success Criteria

- `npm test` either passes with a configured database or fails quickly with a clear setup message.
- Local setup instructions bring the app up from a fresh checkout.
- Production env requirements are documented and guarded.
- Migrations can be run against production deliberately.
- The app can be deployed to Vercel and pass the smoke checklist.
- Client-facing docs no longer describe the app as only a static GitHub Pages prototype.
