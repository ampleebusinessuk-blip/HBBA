# Role-Based Portals — Design Spec

**Date:** 2026-06-26
**Status:** Approved, ready for implementation
**Scope:** Client-side prototype only (no backend, no real auth, no payments)

## Goal

The HBBA Global app currently has a single admin dashboard. Login is mocked — any
submit lands on the same admin view. We need three distinct audiences, each with its
own login result and dashboard:

1. **Admin** (existing) — full operational workspace. Unchanged.
2. **Member** — paid client self-service portal.
3. **Sponsor** — sponsoring brand portal.

This remains a static client-side prototype with hardcoded demo data. There is no real
security, account store, membership gating, or payment processing. Role selection is
mocked via the login email.

## Approach

**Single role-config map in `app.js`** (chosen over per-portal JS modules or separate
HTML files). One `ROLES` object defines each role's nav, profile identity, and landing
page. The existing `render()` / `pageRenderers` mechanism is reused. The sidebar nav
becomes JS-rendered per role (mirroring the existing `renderBottomNav()` pattern),
instead of being hardcoded in `index.html`.

Rationale: minimal change, matches existing single-file architecture, no shell
duplication.

## Role Detection (mocked)

- On login submit, read the email field.
  - email starts with / contains `sponsor` → role `sponsor`
  - email starts with / contains `member` → role `member`
  - otherwise → role `admin`
- Persist to `localStorage['hbba-role']`.
- On boot, restore role from localStorage; if a logged-in route is active, render that
  role's portal. Otherwise show login.
- Login screen shows the three demo emails as a hint so the demo is discoverable:
  - `john.doe@hbbaglobal.co.uk` → Admin
  - `member@hbbaglobal.co.uk` → Member
  - `sponsor@hbbaglobal.co.uk` → Sponsor
- **Logout** clears `hbba-role` and returns to the login screen.

## Navigation per Role

The sidebar `<nav>` is emptied in `index.html` and populated by a new
`renderSidebarNav(role)` driven by `ROLES[role].nav`.

| Role | Nav items (page keys) |
|------|------------------------|
| Admin | dashboard, crm, memberships, events, tickets, sponsors, networking, tasks, email, support, invoices, reports, settings (existing full set) |
| Member | dashboard, myMembership, myEvents, networking, myInvoices, support |
| Sponsor | dashboard, sponsorOverview, brandVisibility, sponsoredEvents, myInvoices, support |

The mobile `bottomNav` is likewise rendered from a per-role short list.

## Page Renderers (new)

Added to the existing `pageRenderers` map. They reuse the data arrays already defined in
`app.js` (events, invoices, members, sponsors).

**Member:**
- `dashboard` (member variant) — welcome, membership status card, upcoming events,
  recent invoices summary.
- `myMembership` — current tier, renewal date, benefits list, upgrade CTA (toast).
- `myEvents` — browse events + "My Tickets" booked list.
- `networking` — reuse existing member directory; "connect" → toast.
- `myInvoices` — the member's invoices + payment status; links to the INV PDF.

**Sponsor:**
- `dashboard` (sponsor variant) — welcome, sponsorship package summary, lead/impression
  highlights, upcoming sponsored events.
- `sponsorOverview` — active package/tier, contract value, inclusions, renewal date.
- `brandVisibility` — impressions, logo placements, leads/introductions, ROI stats
  (stat cards + simple list, reusing existing card styles).
- `sponsoredEvents` — events they sponsor, booth/slot, attendee reach.
- `myInvoices` — sponsorship invoices + payment status.

`dashboard`, `networking`, and `myInvoices` are role-aware: a single key whose renderer
branches on the current role, or a thin wrapper. Implementation picks whichever is
cleaner; behavior is what matters.

## Identity / Topbar per Role

`ROLES[role].profile` supplies the topbar name + label and the page-head greeting:
- Admin → "John Doe / HBBA Admin" (existing).
- Member → "Jane Cole / Premium Member".
- Sponsor → "Acme Corp / Gold Sponsor".

Page-head title/subtitle are set per (role, page) so each portal reads correctly.

## State / Data Flow

- A module-level `currentRole` holds the active role, initialized from localStorage.
- `showApp(page)` uses `currentRole` to render the correct nav, profile, and default
  landing page.
- All demo data stays hardcoded. New sponsor-specific demo data (package, impressions,
  leads) is added as small literal arrays/objects near the existing data block.

## Error Handling

- Unknown role in localStorage → fall back to `admin`.
- A page key not valid for the current role → render that role's `dashboard`.
- These are prototype guards (no security boundary — a user could edit localStorage; out
  of scope, as agreed).

## Files Touched

- `app.js` — `ROLES` map, `currentRole`, role detection on login, `renderSidebarNav`,
  per-role `renderBottomNav`, new page renderers, role-aware profile/page-head, logout,
  boot restore.
- `index.html` — sidebar `<nav>` emptied to a container; login screen demo-email hint.
- `styles.css` — minor additions only; reuse existing card/stat/table classes.

## Out of Scope

Real authentication, password checks, membership payment/gating, sponsor account
provisioning, server, database, per-user data isolation. (Would require the "real
auth + backend" track, explicitly deferred.)

## Success Criteria

- Logging in with each demo email lands in the matching portal.
- Each portal shows only its nav items and its own pages, with correct identity.
- Logout returns to login; re-login as a different role switches portals.
- Admin experience is unchanged from today.
- Still fully client-side; runs on `localhost` with the existing static server.
