-- ============================================================================
-- Migration: Real Supabase Auth Integration
-- 
-- 1. Add auth_id column to users table (links to auth.users.id)
-- 2. Create trigger to auto-create public.users profile on auth signup
-- 3. Update RLS policies for authenticated access
-- ============================================================================

-- ── 1. Add auth_id column ────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- ── 2. Auto-create user profile trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, auth_id, email, first_name, last_name, phone, role, is_active)
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Update RLS policies ───────────────────────────────────────────────────
-- Drop existing broad policies (they used the same name across tables)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','clients','vehicles','routes','trips',
    'income','expense_categories','expenses',
    'fuel_records','maintenance','vehicle_documents','audit_logs'
  ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow authenticated full access" ON %I',
      tbl
    );
  END LOOP;
END $$;

-- Re-create policies: authenticated users get full access to all tables
-- (This is a broad policy; tighten per-role later as needed)
CREATE POLICY "Authenticated full access" ON users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON vehicles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON routes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON trips
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON income
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON expense_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON fuel_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON maintenance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON vehicle_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access" ON audit_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
