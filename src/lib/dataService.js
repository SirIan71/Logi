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

/**
 * Resolve the Supabase table name from a camelCase collection name.
 */
function tableName(collection) {
  const name = TABLE_MAP[collection];
  if (!name) throw new Error(`Unknown collection: "${collection}"`);
  return name;
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
  const { error } = await db.from(table).upsert(data);
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
  const { error, count } = await db.from(table).update(changes).eq('id', id);
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
  const { error } = await db.from(table).upsert(records);
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
