# Business Interface Cleanup Design

## Purpose

Make the HBBA workspace feel credible, focused, and easy to scan without removing any working business capability or changing backend contracts.

## Product Decisions

- Keep the existing admin, member, and sponsor workflows. This pass removes presentation clutter, not business modules or stored data.
- Replace stock people, invented names, hard-coded greetings, and vanity statistics with authenticated account data or neutral fallbacks.
- Remove the non-functional "HBBA Intelligence" promotion from the sidebar. Retain the direct support route.
- Keep global search and the command palette because they provide fast navigation, but give search a business-specific prompt.
- Show notification badges only when unread notifications exist, using the loaded notification count.
- Remove generic page-header actions that are unrelated to the current page. Keep actions within the pages where they apply.
- Keep integrations in Settings for administrators. Hide provider-specific operational controls, such as Eventbrite sync, when the provider is not connected.
- Keep demo infrastructure for development and testing, but present it as operational status only in Settings. Do not advertise demo behavior in ordinary business workflows.
- Replace decorative emoji empty states and greetings with restrained iconography and direct business copy.

## Interface Direction

The visual tone is a quiet professional workspace: clear hierarchy, restrained colour, compact controls, consistent spacing, and sober empty states. The application remains responsive and retains the current HBBA brand assets and established CSS architecture.

## Identity Behaviour

The authenticated user's `full_name`, `email`, and role label drive the top bar and profile menu. When no photo exists, the interface renders stable initials rather than a remote stock image. Dashboard headings use the account or organisation name when available and otherwise use a neutral role-specific title.

## Conditional Behaviour

Integration controls are derived from the existing `adminIntegrations` state. The Eventbrite sync action appears only when Eventbrite is connected. Notification count is derived from `notifications.filter(n => n.unread).length`; zero unread items means no badge.

## Accessibility And Responsiveness

- Interactive controls retain accessible names and keyboard operation.
- Initial avatars are text with appropriate accessible labelling.
- Hidden badges and actions are removed from layout rather than visually obscured.
- Existing mobile navigation and responsive breakpoints remain functional.

## Non-Goals

- No database migrations, API removals, permission changes, or module deletion.
- No redesign of individual CRM, membership, event, sponsor, invoice, or reporting data models.
- No deployment or Vercel environment changes.

## Verification

Automated tests will pin the rendered shell and source-level business rules. The full Node test suite must pass. The running interface will be checked at desktop and mobile widths for identity, navigation, conditional controls, empty states, and overflow.
