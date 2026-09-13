-- Migration: Ensure complete schema for income & invoice persistence
-- Adds columns needed for auto-generated invoices and detailed line items

ALTER TABLE income ADD COLUMN IF NOT EXISTS invoice_month TEXT;
ALTER TABLE income ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;
ALTER TABLE income ADD COLUMN IF NOT EXISTS trip_details JSONB;
ALTER TABLE income ADD COLUMN IF NOT EXISTS redeemable_details JSONB;
ALTER TABLE income ADD COLUMN IF NOT EXISTS freight_amount NUMERIC;
ALTER TABLE income ADD COLUMN IF NOT EXISTS redeemable_amount NUMERIC;
