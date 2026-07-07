-- Supabase Migration: Init Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN,
  password TEXT, -- Plaintext password kept for backward compatibility with AppContext
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  company_name TEXT,
  contact_person TEXT,
  email EMAIL,
  phone NUMERIC,
  address TEXT,
  payment_terms_days INT,
  contract_type TEXT,
  status TEXT,
  rate_type NUMERIC,
  rate_amount NUMERIC,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  registration TEXT UNIQUE,
  make TEXT,
  model TEXT,
  year INT,
  capacity_tons NUMERIC,
  current_odometer NUMERIC,
  status TEXT,
  assigned_driver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  tank_capacity_liters NUMERIC,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT,
  origin TEXT,
  destination TEXT,
  distance_km NUMERIC,
  estimated_fuel_liters NUMERIC,
  estimated_tolls NUMERIC,
  estimated_duration_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  origin TEXT,
  destination TEXT,
  cargo_type TEXT,
  cargo_weight_tons NUMERIC,
  departure_date TEXT,
  arrival_date TEXT,
  estimated_distance_km NUMERIC,
  actual_distance_km NUMERIC,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS income (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT,
  amount NUMERIC,
  amount_paid NUMERIC,
  payment_status TEXT,
  payment_date TEXT,
  due_date TEXT,
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT,
  default_redeemable BOOLEAN,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount NUMERIC,
  is_redeemable BOOLEAN,
  is_redeemed BOOLEAN,
  expense_date TEXT,
  receipt_url VARCHAR,
  submitted_by TEXT references users(id) ON DELETE SET NULL,
  notes TEXT,
  approval_status TEXT,
  approved_by TEXT references users(id) ON DELETE SET NULL,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_records (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  trip_id TEXT REFERENCES trips(id) ON DELETE SET NULL,
  recorded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  liters NUMERIC,
  cost NUMERIC,
  odometer_reading NUMERIC,
  station TEXT,
  date TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  type TEXT,
  service_type TEXT,
  description TEXT,
  cost NUMERIC,
  service_date TEXT,
  odometer_at_service NUMERIC,
  next_due_km NUMERIC,
  next_due_date TEXT,
  vendor TEXT,
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  doc_type TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id TEXT,
  action TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR,
  created_at TEXT
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create basic authenticated-only access policies for all tables
CREATE POLICY "Allow authenticated full access" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON vehicles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON routes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON trips FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON income FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON expense_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON fuel_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON maintenance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON vehicle_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON audit_logs FOR ALL TO authenticated USING (true);
