-- Production email campaigns: marketing consent, authored campaign content,
-- and one idempotent delivery row per recipient.

-- Consent is explicit and opt-in. Everything already in the database predates
-- any recorded consent, so it defaults to opted out.
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opted_in_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opted_out_at timestamptz;

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_opted_in_at timestamptz;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketing_opted_out_at timestamptz;

-- Authored content and delivery bookkeeping.
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS body_text text NOT NULL DEFAULT '';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cta_label text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cta_url text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS failed_count integer NOT NULL DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_error text;

-- 'Active' came from the demo lifecycle and has no meaning in the delivery
-- pipeline; fold it into the closest real state before tightening the check.
UPDATE campaigns SET status = 'Sent' WHERE status = 'Active';

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('Draft', 'Scheduled', 'Sending', 'Sent', 'Partially sent', 'Failed'));

-- One row per campaign and normalised address. The unique constraint is what
-- makes delivery idempotent: a recipient cannot be added, or sent, twice.
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email            text NOT NULL,
  display_name     text,
  public_token     text NOT NULL UNIQUE,
  delivery_status  text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_id      text,
  error            text,
  sent_at          timestamptz,
  first_opened_at  timestamptz,
  first_clicked_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, email)
);

-- The delivery worker selects "everything not yet sent for this campaign".
CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_idx
  ON campaign_recipients (campaign_id, delivery_status);
