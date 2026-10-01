-- Richer invoicing: line items, VAT, due dates, lifecycle.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_on date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal_cents integer NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_cents integer NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminded_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0;

-- Widen the status lifecycle.
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'due', 'paid', 'overdue', 'void'));

CREATE TABLE IF NOT EXISTS invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty         integer NOT NULL DEFAULT 1,
  unit_cents  integer NOT NULL DEFAULT 0,
  sort        integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON invoice_items (invoice_id);

-- Backfill: existing single-amount invoices become one line item; subtotal = amount.
INSERT INTO invoice_items (invoice_id, description, qty, unit_cents, sort)
SELECT i.id, i.description, 1, i.amount_cents, 0
  FROM invoices i
 WHERE NOT EXISTS (SELECT 1 FROM invoice_items it WHERE it.invoice_id = i.id);

UPDATE invoices SET subtotal_cents = amount_cents WHERE subtotal_cents = 0;
