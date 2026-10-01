-- Invoicing that can bill a company, be opened by a client without an account,
-- be signed, be paid, repeat on a schedule and be split into installments --
-- plus the profile fields people maintain about themselves.

/* ===================== CLIENTS ===================== */

-- Until now an invoice could only be addressed to a portal user, so a company
-- that never logs in could not be billed at all.
CREATE TABLE IF NOT EXISTS clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  contact_name    text,
  email           text,
  phone           text,
  address         text,
  city            text,
  postcode        text,
  country         text,
  registration_no text,
  vat_no          text,
  notes           text,
  -- Optional: the same organisation may also hold a portal account.
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_name_idx ON clients (lower(name));

/* ===================== INVOICE DOCUMENT ===================== */

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_title text NOT NULL DEFAULT 'Invoice';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS header_color text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS po_ref text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_category text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS location_mode text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_period text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- Money off, and money already received. Both are applied before VAT so the tax
-- is charged on what is actually being billed.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent';
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_discount_type_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_discount_type_check CHECK (discount_type IN ('percent', 'fixed'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS advance_paid_cents integer NOT NULL DEFAULT 0;

-- A client opens the invoice with this token: no account, no password, and the
-- token reveals nothing about the invoice or the client.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token text;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_public_token_idx ON invoices (public_token) WHERE public_token IS NOT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS allow_card_payment boolean NOT NULL DEFAULT false;

-- Acceptance, recorded as what it is: a name, a time and the address it came
-- from. Not a drawn squiggle pretending to be more.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS signed_name text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS signed_ip text;

-- Repeat billing. The template keeps producing copies; each copy points back.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_interval text;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_recurring_interval_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_recurring_interval_check
  CHECK (recurring_interval IS NULL OR recurring_interval IN ('weekly', 'monthly', 'quarterly', 'yearly'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_next_on date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_until date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_parent_id uuid REFERENCES invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invoices_recurring_due_idx
  ON invoices (recurring_next_on) WHERE recurring_interval IS NOT NULL;

/* ===================== LINE DETAIL ===================== */

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'Service';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS details text;

/* ===================== INSTALLMENTS ===================== */

CREATE TABLE IF NOT EXISTS invoice_installments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  label        text NOT NULL,
  due_on       date,
  amount_cents integer NOT NULL,
  status       text NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'paid')),
  paid_at      timestamptz,
  sort         integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS invoice_installments_invoice_idx ON invoice_installments (invoice_id, sort);

/* ===================== PROFILES ===================== */

-- What a person maintains about themselves. The avatar is stored inline rather
-- than on disk: a container filesystem does not survive a redeploy.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
