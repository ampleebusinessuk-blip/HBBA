-- Clear every business record so the portal starts from a real, empty state.
-- Admin accounts survive so the workspace stays reachable; everything else --
-- demo fixtures from seed.js and the rows created while testing -- goes.
--
-- Deleting in dependency order keeps this readable; the cascades would handle
-- most of it, but being explicit means the intent is auditable.

DELETE FROM support_messages;
DELETE FROM support_tickets;

DELETE FROM event_bookings;
DELETE FROM sponsored_events;
DELETE FROM sponsor_leads;
DELETE FROM sponsorships;

DELETE FROM invoice_items;
DELETE FROM invoices;

DELETE FROM events;
DELETE FROM deals;
DELETE FROM tasks;
DELETE FROM contacts;
DELETE FROM campaigns;
DELETE FROM intro_requests;

DELETE FROM activity_reads;
DELETE FROM activity_log;
DELETE FROM email_log;
DELETE FROM password_resets;

-- Every non-admin account was either a seeded persona or a test signup.
DELETE FROM users WHERE role <> 'admin';

-- Membership pricing shipped as placeholder figures. Keep the tier names so the
-- admin can edit them in place, but clear the invented prices and benefits.
UPDATE membership_tiers SET price_cents = 0, perks = '[]'::jsonb;

-- No membership assignments survive the wipe.
UPDATE users SET tier = NULL, renews_on = NULL, nudged_at = NULL;
