/**
 * SIRIAN Data Service Layer
 *
 * Generic CRUD operations backed by Supabase.
 * The function signatures stay identical to the original Dexie implementation,
 * so AppContext needs zero changes.
 */
import db from './db.js';

// ─── Collection name → Supabase table name mapping ────────────────────────────
// AppContext uses camelCase collection names; Supabase tables use snake_case.
const TABLE_MAP = {
  users:            'users',
  clients:          'clients',
  vehicles:         'vehicles',
  routes:           'routes',
  trips:            'trips',
  income:           'income',
  expenseCategories:'expense_categories',
  expenses:         'expenses',
  fuelRecords:      'fuel_records',
  maintenance:      'maintenance',
  vehicleDocuments: 'vehicle_documents',
  auditLogs:        'audit_logs',
};

// ─── Column whitelists per table (must match DB schema exactly) ────────────────
// Any field NOT in this list is stripped before insert/update to prevent
// "column does not exist" errors from Supabase.
const COLUMN_WHITELIST = {
  users:              ['id', 'auth_id', 'first_name', 'last_name', 'email', 'phone', 'role', 'is_active', 'password', 'created_at', 'updated_at'],
  clients:            ['id', 'company_name', 'contact_person', 'email', 'phone', 'address', 'payment_terms_days', 'contract_type', 'status', 'rate_type', 'rate_amount', 'created_at'],
  vehicles:           ['id', 'registration', 'make', 'model', 'year', 'capacity_tons', 'current_odometer', 'status', 'assigned_driver_id', 'tank_capacity_liters', 'created_at'],
  routes:             ['id', 'name', 'origin', 'destination', 'distance_km', 'estimated_fuel_liters', 'estimated_tolls', 'estimated_duration_hours', 'notes', 'created_at'],
  trips:              ['id', 'route_id', 'vehicle_id', 'driver_id', 'client_id', 'origin', 'destination', 'cargo_type', 'cargo_weight_tons', 'departure_date', 'arrival_date', 'estimated_distance_km', 'actual_distance_km', 'status', 'notes', 'created_at', 'updated_at'],
  income:             ['id', 'trip_id', 'client_id', 'invoice_number', 'amount', 'amount_paid', 'payment_status', 'payment_date', 'due_date', 'notes', 'created_at'],
  expense_categories: ['id', 'name', 'default_redeemable', 'icon'],
  expenses:           ['id', 'trip_id', 'vehicle_id', 'driver_id', 'category_id', 'amount', 'is_redeemable', 'is_redeemed', 'expense_date', 'receipt_url', 'submitted_by', 'notes', 'approval_status', 'approved_by', 'created_at'],
  fuel_records:       ['id', 'vehicle_id', 'trip_id', 'recorded_by', 'liters', 'cost', 'odometer_reading', 'station', 'date', 'created_at'],
  maintenance:        ['id', 'vehicle_id', 'type', 'service_type', 'description', 'cost', 'service_date', 'odometer_at_service', 'next_due_km', 'next_due_date', 'vendor', 'notes', 'created_at'],
  vehicle_documents:  ['id', 'vehicle_id', 'doc_type', 'issue_date', 'expiry_date', 'notes'],
  audit_logs:         ['id', 'user_id', 'entity_type', 'entity_id', 'action', 'old_values', 'new_values', 'created_at'],
};

/**
 * Resolve the Supabase table name from a camelCase collection name.
 */
function tableName(collection) {
  const name = TABLE_MAP[collection];
  if (!name) throw new Error(`Unknown collection: "${collection}"`);
  return name;
}

/**
 * Strip any fields that don't exist as columns in the DB table.
 * Also convert empty strings to null for foreign-key columns,
 * since Supabase FK constraints reject "" (not a valid reference).
 */
const FK_COLUMNS = new Set([
  'route_id', 'vehicle_id', 'driver_id', 'client_id', 'trip_id',
  'category_id', 'user_id', 'recorded_by', 'assigned_driver_id', 'auth_id',
  'submitted_by', 'approved_by',
]);

function sanitize(table, data) {
  const allowed = COLUMN_WHITELIST[table];
  if (!allowed) return data; // No whitelist defined — pass through
  const clean = {};
  for (const key of allowed) {
    if (key in data) {
      // Convert empty strings to null for FK columns
      clean[key] = (FK_COLUMNS.has(key) && data[key] === '') ? null : data[key];
    }
  }
  return clean;
}

// ─── CRUD operations ────────────────────────────────────────────────────────

/**
 * Fetch every record from a collection.
 * @param {string} collection — camelCase name (e.g. "fuelRecords")
 * @returns {Promise<Array>}
 */
export async function getAll(collection) {
  const table = tableName(collection);
  const { data, error } = await db.from(table).select('*');
  if (error) {
    console.error(`Error fetching from ${table}:`, error.message);
    return [];
  }
  return data || [];
}

/**
 * Fetch a single record by primary key.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<Object|undefined>}
 */
export async function getById(collection, id) {
  const table = tableName(collection);
  const { data, error } = await db.from(table).select('*').eq('id', id).single();
  if (error) {
    console.error(`Error fetching ${id} from ${table}:`, error.message);
    return undefined;
  }
  return data;
}

/**
 * Insert a new record (or replace if same PK exists).
 * @param {string} collection
 * @param {Object} data — must include an `id` field
 * @returns {Promise<string>} the id of the inserted record
 */
export async function insert(collection, data) {
  const table = tableName(collection);
  const clean = sanitize(table, data);
  const { error } = await db.from(table).upsert(clean);
  if (error) {
    console.error(`Error inserting into ${table}:`, error.message);
    throw error;
  }
  return data.id;
}

/**
 * Update an existing record (partial merge).
 * @param {string} collection
 * @param {string} id
 * @param {Object} changes — fields to merge
 * @returns {Promise<number>} number of rows updated (0 or 1)
 */
export async function update(collection, id, changes) {
  const table = tableName(collection);
  const clean = sanitize(table, changes);
  const { error, count } = await db.from(table).update(clean).eq('id', id);
  if (error) {
    console.error(`Error updating ${id} in ${table}:`, error.message);
    throw error;
  }
  // Supabase doesn't return count by default without `{ count: 'exact' }`, 
  // but keeping signature similar is fine.
  return 1;
}

/**
 * Delete a record by primary key.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(collection, id) {
  const table = tableName(collection);
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) {
    console.error(`Error deleting ${id} from ${table}:`, error.message);
    throw error;
  }
}

/**
 * Bulk-insert records (used for seeding).
 * @param {string} collection
 * @param {Array<Object>} records
 * @returns {Promise<void>}
 */
export async function bulkInsert(collection, records) {
  const table = tableName(collection);
  const cleanRecords = records.map(r => sanitize(table, r));
  const { error } = await db.from(table).upsert(cleanRecords);
  if (error) {
    console.error(`Error bulk inserting into ${table}:`, error.message);
    throw error;
  }
}

/**
 * Check if a collection has any data.
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function isEmpty(collection) {
  const table = tableName(collection);
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`Error counting ${table}:`, error.message);
    return true; // fail safe
  }
  return count === 0;
}

/**
 * Clear all data in a specific collection.
 * @param {string} collection
 * @returns {Promise<void>}
 */
export async function clearCollection(collection) {
  const table = tableName(collection);
  // Warning: This requires RLS or privileges to delete all rows.
  // In Supabase, usually you cannot delete without a WHERE clause easily.
  // We'll use a hack to delete where id is not null.
  const { error } = await db.from(table).delete().neq('id', 'null');
  if (error) {
    console.error(`Error clearing ${table}:`, error.message);
  }
}

/**
 * Clear the entire database (all tables).
 * Useful for testing or full reset.
 * @returns {Promise<void>}
 */
export async function clearAll() {
  const tables = Object.values(TABLE_MAP);
  await Promise.all(tables.map(async (t) => {
    await db.from(t).delete().neq('id', 'null');
  }));
}
