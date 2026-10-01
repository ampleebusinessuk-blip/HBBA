CREATE TABLE IF NOT EXISTS deals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  value_cents integer NOT NULL DEFAULT 0,
  owner      text,
  tier       text,
  stage      text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'won', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deals_stage_idx ON deals (stage);
