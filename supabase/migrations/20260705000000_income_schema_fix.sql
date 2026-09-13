-- Migration: Ensure complete schema for income & invoice persistence
-- Adds missing columns needed for income transactions and auto-generated invoices

ALTER TABLE income ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE income ADD COLUMN IF NOT EXISTS invoice_month TEXT;
ALTER TABLE income ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;
ALTER TABLE income ADD COLUMN IF NOT EXISTS trip_details JSONB;
ALTER TABLE income ADD COLUMN IF NOT EXISTS redeemable_details JSONB;
ALTER TABLE income ADD COLUMN IF NOT EXISTS freight_amount NUMERIC;
ALTER TABLE income ADD COLUMN IF NOT EXISTS redeemable_amount NUMERIC;

-- Enforce strict single invoice per client per billing period at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_client_invoice_month 
  ON income (client_id, invoice_month) 
  WHERE client_id IS NOT NULL AND invoice_month IS NOT NULL AND invoice_month != '';
