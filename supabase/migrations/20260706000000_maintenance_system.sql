-- ============================================================================
-- Migration: Robust Maintenance Schedule System & Repair Approval Workflow
-- Adds support for multi-step approval sequence, evidence attachments (photos/audio),
-- non-working day scheduling, Kenya compliance certifications, and workshop/mechanic tracking.
-- ============================================================================

-- 1. Create workshops directory table
CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  lead_mechanic_name TEXT,
  lead_mechanic_phone TEXT,
  specialties TEXT[],
  rating NUMERIC DEFAULT 4.8,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Extend maintenance table with comprehensive workflow fields
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS driver_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS expected_cost NUMERIC DEFAULT 0;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS parts_cost NUMERIC DEFAULT 0;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS labor_cost NUMERIC DEFAULT 0;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS scheduled_date TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS is_non_working_day BOOLEAN DEFAULT false;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS non_working_day_type TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS workshop_id TEXT REFERENCES workshops(id) ON DELETE SET NULL;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS mechanic_name TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS mechanic_phone TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS evidence_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS evidence_audio JSONB DEFAULT 'null'::jsonb;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS ops_approved_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS ops_approved_at TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS ops_notes TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS admin_approved_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS admin_approved_at TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS compliance_category TEXT;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS items_serviced JSONB DEFAULT '[]'::jsonb;

-- 3. Enable RLS on workshops
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON workshops
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
