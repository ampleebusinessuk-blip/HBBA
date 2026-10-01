-- CRM contacts, membership tiers, campaigns, introductions, and the activity feed
-- that powers the dashboard and the notification panel.

CREATE TABLE IF NOT EXISTS contacts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  email            text NOT NULL UNIQUE,
  company          text,
  city             text,
  phone            text,
  tier             text NOT NULL DEFAULT 'Bronze',
  status           text NOT NULL DEFAULT 'New' CHECK (status IN ('Active', 'Warm', 'New', 'Cold')),
  owner            text,
  avatar           text,
  notes            text,
  user_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts (status);

CREATE TABLE IF NOT EXISTS membership_tiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  price_cents integer NOT NULL DEFAULT 0,
  color       text NOT NULL DEFAULT 'bronze',
  perks       jsonb NOT NULL DEFAULT '[]',
  sort        integer NOT NULL DEFAULT 0
);

-- Which tier a member is on, and when it lapses.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS renews_on date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nudged_at timestamptz;

CREATE TABLE IF NOT EXISTS campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  subject       text,
  segment       text NOT NULL DEFAULT 'All members',
  status        text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Active', 'Sent')),
  scheduled_for timestamptz,
  sent_count    integer NOT NULL DEFAULT 0,
  open_count    integer NOT NULL DEFAULT 0,
  click_count   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intro_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES users(id) ON DELETE CASCADE,
  from_name    text NOT NULL,
  to_name      text NOT NULL,
  reason       text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'declined')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intro_status_idx ON intro_requests (status);

-- One feed backs both "Recent activity" and the notification panel.
CREATE TABLE IF NOT EXISTS activity_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind             text NOT NULL,
  title            text NOT NULL,
  body             text,
  tone             text NOT NULL DEFAULT 'blue',
  audience_role    text NOT NULL DEFAULT 'admin' CHECK (audience_role IN ('admin', 'member', 'sponsor', 'all')),
  audience_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_created_idx ON activity_log (created_at DESC);

CREATE TABLE IF NOT EXISTS activity_reads (
  activity_id uuid NOT NULL REFERENCES activity_log(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);

-- Events can now be cancelled from the admin desk.
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('Confirmed', 'Selling', 'Draft', 'Cancelled'));

INSERT INTO membership_tiers (name, price_cents, color, perks, sort) VALUES
  ('Gold',   240000, 'gold',   '["VIP event access","Dedicated relationship manager","Quarterly briefings","Sponsor introductions"]', 0),
  ('Silver', 120000, 'silver', '["Premium event access","Member directory","Monthly newsletter","Trade missions"]', 1),
  ('Bronze',  48000, 'bronze', '["Standard event access","Online community","Resource library"]', 2)
ON CONFLICT (name) DO NOTHING;
