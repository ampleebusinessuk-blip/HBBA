# Business Interface Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a credible, focused HBBA interface that uses real account state and removes misleading or non-functional presentation clutter.

**Architecture:** Preserve the existing Express APIs and plain JavaScript page renderers. Update the static shell and shared rendering helpers so identity, notifications, and integration actions derive from already-loaded state; use CSS to support an initials avatar and a quieter layout.

**Tech Stack:** Node.js 24, Express 4, browser JavaScript, HTML, CSS, `node:test`

**Spec:** `docs/superpowers/specs/2026-09-23-business-interface-cleanup-design.md`

## Global Constraints

- Preserve all existing business modules, backend APIs, persisted data, and role permissions.
- Do not add dependencies or remote stock imagery.
- Provider-specific operational controls appear only when the provider is connected.
- User-facing identity comes from the authenticated session, with neutral text fallbacks.
- The full `npm test` suite must pass.

## Review Focus

- Missing or blank `full_name` must produce readable initials and a neutral account label.
- Names containing extra whitespace or multiple words must produce stable initials without layout overflow.
- Zero unread notifications must remove the badge; non-zero counts must display the current count.
- Eventbrite disconnected state must not expose a sync action; connected state must expose it.
- Member, sponsor, and admin navigation must remain reachable on desktop and mobile.

---

### Task 1: Pin The Professional Shell Contract

**Files:**
- Create: `test/interface-cleanup.test.js`
- Test: `public/index.html`
- Test: `public/app.js`

**Interfaces:**
- Consumes: static HTML and JavaScript source files
- Produces: regression checks for removed placeholder content and required data-driven hooks

- [ ] **Step 1: Write the failing shell tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');

test('shell contains no invented identity, vanity proof, or intelligence promotion', () => {
  for (const text of ['John Doe', '1,250', '£78k', 'HBBA Intelligence', 'Open Insights']) {
    assert.equal(html.includes(text), false, text);
  }
});

test('interface source derives identity and provider actions from live state', () => {
  assert.match(app, /currentUser\?\.full_name/);
  assert.match(app, /adminIntegrations\.eventbrite/);
  assert.match(app, /notifications\.filter\(\(n\) => n\.unread\)/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/interface-cleanup.test.js`
Expected: FAIL because the HTML still contains invented identity, vanity metrics, and the promotional card, and notification/provider controls are not fully conditional.

- [ ] **Step 3: Keep the test unchanged for Tasks 2-4**

The assertions define the cleanup boundary and must turn green through production changes only.

### Task 2: Simplify Authentication And Application Chrome

**Files:**
- Modify: `public/index.html`
- Modify: `public/styles.css`

**Interfaces:**
- Consumes: existing auth forms, sidebar navigation container, topbar controls
- Produces: neutral shell placeholders and `.profile-initials` styling consumed by Task 3

- [ ] **Step 1: Remove misleading and non-functional content**

Delete the hard-coded proof statistics, stock profile image, invented name, default emoji greeting, generic header Export/New Event actions, and HBBA Intelligence card. Change `Login`/`Signup` to `Sign in`/`Create account`, and change global search to `Search members, events, sponsors...`.

- [ ] **Step 2: Add a neutral profile placeholder**

Use `<span class="profile-initials" aria-hidden="true">HB</span>` inside `#profileToggle`, with neutral `Account` and `HBBA Global` text that Task 3 replaces after authentication.

- [ ] **Step 3: Style the initials and refine shell density**

Add fixed dimensions, centred typography, contrast, and responsive constraints for `.profile-initials`; reduce decorative sidebar spacing left by the removed promotion while preserving the support action.

- [ ] **Step 4: Run the focused test**

Run: `node --test test/interface-cleanup.test.js`
Expected: identity/promotion assertions PASS; live-state assertions may still FAIL.

### Task 3: Make Shared Identity And Notifications Data-Driven

**Files:**
- Modify: `public/app.js`
- Test: `test/interface-cleanup.test.js`

**Interfaces:**
- Consumes: `currentUser`, `currentRole`, `ROLES[role].label`, `notifications`
- Produces: `accountName()`, `accountInitials()`, `applyRoleIdentity(role)`, `updateNotificationBadge()`

- [ ] **Step 1: Add failing edge-case assertions**

Extend `test/interface-cleanup.test.js` to assert that the source declares `accountInitials`, trims names, caps output at two characters, and defines `updateNotificationBadge` using unread notification state.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/interface-cleanup.test.js`
Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement identity helpers and neutral metadata**

Add helpers that normalize the authenticated name, generate one or two initials, and fall back to `HB`. Remove stock `profile` objects from `ROLES`; render dashboard titles from the authenticated account at render time and use neutral metadata defaults.

- [ ] **Step 4: Render the account in the topbar and profile menu**

Update `applyRoleIdentity` and `renderProfileMenu` to use the helpers and role label. Replace the image node content with initials without remote requests.

- [ ] **Step 5: Render the live unread count**

Implement `updateNotificationBadge()` to count unread notifications, update badge text, and toggle the badge class/hidden state. Call it whenever notifications load or are marked read.

- [ ] **Step 6: Run focused and full tests**

Run: `node --test test/interface-cleanup.test.js`
Expected: PASS.

Run: `npm test`
Expected: all tests PASS.

### Task 4: Keep Integration And Empty-State Language Operational

**Files:**
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Test: `test/interface-cleanup.test.js`

**Interfaces:**
- Consumes: `adminIntegrations.eventbrite`, existing `emptyState`, existing settings integration status
- Produces: conditional Eventbrite action and icon-led empty state

- [ ] **Step 1: Add failing conditional-control assertions**

Assert that the Eventbrite sync button template is guarded by `adminIntegrations.eventbrite`, normal email workflow headings do not say `Demo outbox`, and empty states do not use the `.emoji` element.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/interface-cleanup.test.js`
Expected: FAIL on the unguarded sync action, demo heading, and emoji empty state.

- [ ] **Step 3: Implement the minimal presentation changes**

Guard the sync button with integration state, title the email list `Outbox`, retain honest connection status in Settings, and replace the emoji with a styled `inbox` icon from the existing icon system.

- [ ] **Step 4: Run focused and full tests**

Run: `node --test test/interface-cleanup.test.js`
Expected: PASS.

Run: `npm test`
Expected: all tests PASS.

### Task 5: Verify The Running Experience

**Files:**
- Verify: `public/index.html`
- Verify: `public/app.js`
- Verify: `public/styles.css`

**Interfaces:**
- Consumes: complete local application
- Produces: desktop/mobile visual verification evidence

- [ ] **Step 1: Start the application**

Run: `npm run dev`
Expected: Express reports a local URL and remains running without startup errors.

- [ ] **Step 2: Inspect desktop at 1440 x 900**

Verify authentication copy, shell hierarchy, initials identity, role navigation, unread badge behaviour, and absence of stock identity or promotional clutter.

- [ ] **Step 3: Inspect mobile at 390 x 844**

Verify forms fit, topbar controls do not overlap, bottom navigation remains usable, and the longest role/account labels stay within their containers.

- [ ] **Step 4: Exercise primary role paths**

Verify admin, member, and sponsor landing pages render; Eventbrite sync is absent when disconnected; Settings still reports integration state; no browser console errors appear.

- [ ] **Step 5: Run final verification**

Run: `npm test`
Expected: all tests PASS with no warnings or failures.
