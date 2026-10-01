import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The frontend has no build step and no DOM test harness, so these are contract
// tests over the source: the hooks the API depends on must exist, and copy that
// is no longer true must be gone.
const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');

test('campaign form captures content, CTA and consent-qualified audience', () => {
  assert.match(app, /data-cp="body_text"/);
  assert.match(app, /data-cp="cta_label"/);
  assert.match(app, /data-cp="cta_url"/);
  assert.match(app, /eligible/);
  assert.match(app, /Estimated open rate/);
  assert.match(app, /data-retry-campaign/);
  assert.doesNotMatch(app, /Scheduling records the campaign now; delivery runs once an email provider is connected/);
});

test('admin contact and invite forms expose explicit marketing consent', () => {
  assert.match(app, /data-field="marketing_opt_in"/);
  assert.match(app, /data-iu="marketing_opt_in"/);
});

test('campaign requests carry the authored fields', () => {
  // The form is read in the click dispatcher, which is what builds the payload.
  const handler = app.slice(app.indexOf("find('[data-create-campaign]')"), app.indexOf("find('[data-create-campaign]')") + 700);
  for (const field of ['body_text', 'cta_label', 'cta_url', 'segment', 'scheduled_for']) {
    assert.match(handler, new RegExp(field), `the campaign payload includes ${field}`);
  }
});

test('delivery is reported from the server result, never assumed', () => {
  const sendCampaign = app.slice(app.indexOf('async function sendCampaign'), app.indexOf('async function sendCampaign') + 1400);
  assert.match(sendCampaign, /data\.status/, 'the returned status drives the message');
  assert.match(sendCampaign, /sent === 0|!data\.sent|data\.sent \? /, 'zero delivered is never a success');
});

test('campaign rows only offer actions that are valid for their state', () => {
  const emailPage = app.slice(app.indexOf('function emailPage()'), app.indexOf('function emailPage()') + 4000);
  assert.match(emailPage, /data-send-campaign/);
  assert.match(emailPage, /data-retry-campaign/);
  assert.match(emailPage, /Partially sent|Failed/, 'retryable states are recognised');
  assert.match(emailPage, /Sending/, 'an in-flight campaign is recognised');
});

test('consent is visible where records are listed', () => {
  assert.match(app, /marketing_opt_in/, 'the flag reaches the frontend');
  assert.match(app, /Marketing emails|Marketing consent|Opted in/i, 'and is labelled for a human');
});

test('campaign styles keep the form usable on a phone', () => {
  assert.match(css, /campaign-message|\.campaign-actions/, 'campaign-specific rules exist');
  assert.match(css, /min-height/, 'the message box has a stable height');
  assert.match(css, /480px/, 'actions reflow on small screens');
});
