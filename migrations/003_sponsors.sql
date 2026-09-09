CREATE TABLE IF NOT EXISTS sponsorships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier         text NOT NULL DEFAULT 'Gold',
  value_cents  integer NOT NULL DEFAULT 0,
  renews       text,
  since        text,
  impressions  integer NOT NULL DEFAULT 0,
  placements   integer NOT NULL DEFAULT 0,
  leads_count  integer NOT NULL DEFAULT 0,
  meetings     integer NOT NULL DEFAULT 0,
  inclusions   jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsor_leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  company    text NOT NULL,
  interest   text,
  when_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsored_events (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id  uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  booth     text,
  reach     text,
  UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS leads_user_idx ON sponsor_leads (user_id);
CREATE INDEX IF NOT EXISTS sponsored_user_idx ON sponsored_events (user_id);
