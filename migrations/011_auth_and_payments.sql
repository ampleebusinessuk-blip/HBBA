-- Password reset / invite tokens, and the Stripe payment record.

CREATE TABLE IF NOT EXISTS password_resets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose    text NOT NULL DEFAULT 'reset' CHECK (purpose IN ('reset', 'invite')),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);

-- Payment provider bookkeeping so a Stripe webhook can settle an invoice once.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_ref text;

-- Delivery record for anything the app emails out.
CREATE TABLE IF NOT EXISTS email_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email    text NOT NULL,
  subject     text NOT NULL,
  kind        text NOT NULL,
  provider_id text,
  status      text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'skipped', 'failed')),
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_log_created_idx ON email_log (created_at DESC);
