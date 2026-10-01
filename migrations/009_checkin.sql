ALTER TABLE event_bookings ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false;
ALTER TABLE event_bookings ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
