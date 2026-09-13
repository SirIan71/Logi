-- Migration: Ensure complete schema for income & invoice persistence
-- Adds missing columns needed for income transactions and auto-generated invoices

ALTER TABLE income ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE income ADD COLUMN IF NOT EXISTS invoice_month TEXT;
ALTER TABLE income ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;
ALTER TABLE income ADD COLUMN IF NOT EXISTS trip_details JSONB;
ALTER TABLE income ADD COLUMN IF NOT EXISTS redeemable_details JSONB;
ALTER TABLE income ADD COLUMN IF NOT EXISTS freight_amount NUMERIC;
ALTER TABLE income ADD COLUMN IF NOT EXISTS redeemable_amount NUMERIC;
