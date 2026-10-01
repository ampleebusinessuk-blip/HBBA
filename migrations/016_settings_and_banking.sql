-- Workspace settings that an administrator can change without a developer:
-- business identity, bank accounts shown on invoices, and integration
-- credentials.
--
-- Secrets are stored encrypted (AES-256-GCM, see server/settings.js). An
-- environment variable of the same name always wins, so existing deployments
-- keep working and a platform secret store can still be the source of truth.

CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      text,
  is_secret  boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Bank details printed on invoices. More than one account is allowed so an
-- invoice can be issued against whichever is appropriate.
CREATE TABLE IF NOT EXISTS bank_accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label          text NOT NULL,
  account_name   text NOT NULL,
  bank_name      text,
  account_number text,
  sort_code      text,
  iban           text,
  swift          text,
  account_type   text,
  is_default     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Exactly one default, enforced by the database rather than by hope.
CREATE UNIQUE INDEX IF NOT EXISTS bank_accounts_one_default
  ON bank_accounts (is_default) WHERE is_default = true;
