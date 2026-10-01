CREATE TABLE IF NOT EXISTS events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text UNIQUE NOT NULL,
  title      text NOT NULL,
  date_label text NOT NULL,
  time_label text NOT NULL,
  city       text NOT NULL,
  capacity   integer NOT NULL DEFAULT 100,
  img        text,
  status     text NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Selling', 'Draft')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_bookings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tier       text NOT NULL DEFAULT 'Standard' CHECK (tier IN ('Standard', 'VIP')),
  status     text NOT NULL DEFAULT 'Confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number      text UNIQUE NOT NULL,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount_cents integer NOT NULL,
  currency    text NOT NULL DEFAULT 'GBP',
  issued_on   text NOT NULL,
  status      text NOT NULL DEFAULT 'due' CHECK (status IN ('paid', 'due', 'overdue', 'draft')),
  pdf_url     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_user_idx ON event_bookings (user_id);
CREATE INDEX IF NOT EXISTS invoices_user_idx ON invoices (user_id);
