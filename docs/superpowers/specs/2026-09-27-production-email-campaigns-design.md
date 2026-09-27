# Production Email Campaigns Design

**Date:** 2026-09-27
**Status:** Approved in principle; awaiting written-spec review

## Objective

Turn the existing campaign demo into a production-capable email campaign system while retaining Resend as the delivery provider. Provider credentials are outside this implementation. The system must support authored content, explicit marketing consent, scheduled delivery, idempotent retries, unsubscribe, delivery outcomes, and unique open/click reporting.

Transactional email such as password resets, invitations, invoice reminders, and operational notifications is outside marketing consent and continues to use the existing email service.

## Product Behaviour

Administrators can create a campaign with an internal name, subject, plain-text message body, audience segment, optional CTA label and URL, and optional future send time. The server converts the message to escaped branded HTML; administrators cannot submit arbitrary HTML.

A campaign without a future send time is saved as `Draft`. A future send time creates a `Scheduled` campaign. Drafts can be sent manually. Scheduled campaigns are claimed by the scheduler when due. Administrators can also send a scheduled campaign immediately.

Supported segments remain:

- All members
- Gold tier
- Expiring soon
- Sponsors
- Contacts

Audience counts and recipient resolution include only records with explicit marketing opt-in. Existing users and contacts default to opted out. Duplicate email addresses within a campaign resolve to one recipient.

Every marketing email includes an unsubscribe link. Unsubscribing updates every matching user/contact record for that email address, records the time, and excludes the address from future campaigns. The unsubscribe page must not require authentication and must not reveal whether another address exists.

## Data Model

Add marketing-consent fields to `users` and `contacts`:

- `marketing_opt_in boolean NOT NULL DEFAULT false`
- `marketing_opted_in_at timestamptz`
- `marketing_opted_out_at timestamptz`

Extend `campaigns` with:

- `body_text text NOT NULL DEFAULT ''`
- `cta_label text`
- `cta_url text`
- `started_at timestamptz`
- `completed_at timestamptz`
- `failed_count integer NOT NULL DEFAULT 0`
- `last_error text`

Replace the status constraint with `Draft`, `Scheduled`, `Sending`, `Sent`, `Partially sent`, and `Failed`.

Add `campaign_recipients` with one row per campaign and normalized email address. It stores display name, an unguessable public token, delivery status (`pending`, `sent`, `failed`, or `skipped`), provider ID, error, sent time, first-open time, first-click time, and timestamps. A unique `(campaign_id, email)` constraint prevents duplicate recipients. A unique token index supports tracking without exposing email addresses.

Counts shown in the campaign dashboard are derived from recipient rows. Opens and clicks count distinct recipients, not raw events.

## Consent Management

Admin user/contact forms expose a clear `Marketing emails` checkbox. Profile editing does not allow users to opt themselves in during this release; consent is managed by an administrator based on the organisation's recorded lawful basis.

Creating or updating a user/contact with opt-in enabled stamps `marketing_opted_in_at` and clears `marketing_opted_out_at`. Disabling it stamps `marketing_opted_out_at`. Unsubscribe always wins and disables all matching records.

The campaign UI displays both total segment size and eligible opted-in size so administrators can understand exclusions before sending.

## Delivery Pipeline

Campaign delivery is implemented as a reusable service rather than inside the HTTP route.

1. Atomically claim an eligible campaign by changing `Draft` or due `Scheduled` to `Sending`.
2. Resolve the consent-qualified audience and upsert recipient rows.
3. Process only recipients that are not already `sent`.
4. Build branded HTML and plain text with tracked CTA and unsubscribe links.
5. Send through the existing email adapter and save each outcome.
6. Recompute campaign counts and finish as:
   - `Sent` when all eligible recipients were delivered.
   - `Partially sent` when at least one delivered and at least one failed/skipped.
   - `Failed` when none were delivered.

A repeated request is safe: sent recipients are never sent twice. Failed recipients may be retried through the same service. An empty eligible audience returns a validation error and leaves a manual campaign unsent.

When Resend is not configured, manual and scheduled delivery records recipients as skipped and ends as `Failed`; the UI explains that nothing was delivered. It must never label the campaign `Sent` based only on audience size.

## Scheduling

Add a protected `GET /api/ops/campaigns/run` endpoint. Vercel Cron invokes it with `Authorization: Bearer <CRON_SECRET>`. When `CRON_SECRET` is absent, the endpoint returns 404. Invalid credentials return 401.

The worker claims due campaigns using row locking so concurrent invocations cannot send the same campaign twice. One invocation processes a bounded number of campaigns to stay within the function duration. `vercel.json` schedules the endpoint every five minutes.

Manual send uses the same delivery service as scheduled send.

## Tracking And Unsubscribe

Each recipient gets an opaque random token.

- `GET /api/campaigns/open/:token.gif` records the first open and returns a cache-disabled transparent GIF.
- `GET /api/campaigns/click/:token` records the first click and redirects only to the CTA URL stored on the associated campaign.
- `GET /unsubscribe/:token` renders a small confirmation page.
- `POST /api/campaigns/unsubscribe/:token` records opt-out and returns a neutral success response.

Tracking endpoints never accept a destination URL from the request, preventing open redirects. Unknown tokens return a neutral response. Tracking pixels are inherently approximate because some clients block or proxy images; the UI labels opens as estimated.

All campaign emails include an unsubscribe URL in HTML and text. Provider-level list-unsubscribe headers may be added when supported by the existing Resend request format, but the application link remains authoritative.

## API And UI

Campaign creation validates:

- Name, subject, and body are required.
- CTA label and URL must be supplied together.
- CTA URL must be absolute `https`, except local `http` URLs in development.
- Scheduled time must be valid and in the future.

Campaign list responses include delivery, failure, unique-open, unique-click, total-segment, and eligible-recipient counts. The admin campaign form adds message, CTA, schedule, and consent-aware audience information. Campaign rows show truthful state and expose send/retry only when valid for the current state.

The outbox remains available for operational diagnosis and includes campaign delivery outcomes.

## Error Handling And Security

- Campaign send endpoints remain admin-only.
- Public tokens contain no email or campaign data and are generated with cryptographic randomness.
- User-authored message text is HTML-escaped before rendering.
- Delivery failures are recorded per recipient and never roll back successful deliveries.
- Campaign claiming and recipient uniqueness provide concurrency safety.
- Public endpoints are rate-limited by the existing application limiter.
- Logs and API responses do not expose provider credentials or full recipient lists.

## Verification

Automated tests must cover:

- Existing records default to opted out.
- Audience counts distinguish total and eligible recipients.
- Non-consenting recipients are never inserted into campaign recipients or sent.
- Consent updates stamp the correct timestamps.
- Campaign content and CTA validation.
- Manual send success, empty audience, missing provider, partial failure, and retry without duplicate delivery.
- Scheduled campaigns are ignored before due time and claimed once after due time.
- Concurrent worker calls cannot duplicate sends.
- Open tracking counts a recipient once.
- Click tracking counts once and redirects only to the stored CTA.
- Unsubscribe is neutral, idempotent, and suppresses all matching records.
- Transactional mail remains unaffected by marketing opt-out.
- Admin UI creates, schedules, sends, retries, and reports campaigns using real API state.

The complete existing test suite must remain green. Browser verification must cover desktop and mobile campaign creation and the campaign status/reporting view.

## Deployment Requirements

The implementation adds `CRON_SECRET` as a required production variable for scheduled sending. Live delivery still requires `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_URL`. Database migrations must be applied before enabling the cron schedule.

## Out Of Scope

- Drag-and-drop or arbitrary HTML email design
- A/B testing
- Multi-step automations
- Provider webhook processing for bounces and complaints
- Self-service preference categories beyond global marketing opt-out
- Guaranteed open accuracy
