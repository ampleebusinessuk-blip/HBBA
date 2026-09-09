CREATE TABLE IF NOT EXISTS support_tickets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    text NOT NULL,
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_role text NOT NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx ON support_messages (ticket_id);
