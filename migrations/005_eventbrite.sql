-- Link events to Eventbrite for two-way sync.
ALTER TABLE events ADD COLUMN IF NOT EXISTS eventbrite_id text UNIQUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'local' CHECK (source IN ('local', 'eventbrite'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS eb_attendees integer NOT NULL DEFAULT 0;
