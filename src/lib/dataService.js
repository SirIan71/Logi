/**
 * SIRIAN Data Service Layer
 *
 * Generic CRUD operations backed by Dexie.js (IndexedDB).
 * This is the ONLY module that touches the database directly.
 *
 * Migration path to Supabase:
 *   Replace the implementation of each function with supabase.from(table)... calls.
 *   The function signatures stay identical, so AppContext needs zero changes.
 */
import db from './db.js';

// ─── Collection name → Dexie table name mapping ────────────────────────────
// AppContext uses camelCase collection names; Dexie tables use snake_case.
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
 * Resolve the Dexie table from a camelCase collection name.
 */
function table(collection) {
  const name = TABLE_MAP[collection];
  if (!name) throw new Error(`Unknown collection: "${collection}"`);
  return db[name];
}

// ─── CRUD operations ────────────────────────────────────────────────────────

/**
 * Fetch every record from a collection.
 * @param {string} collection — camelCase name (e.g. "fuelRecords")
 * @returns {Promise<Array>}
 */
export async function getAll(collection) {
  return table(collection).toArray();
}

/**
 * Fetch a single record by primary key.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<Object|undefined>}
 */
export async function getById(collection, id) {
  return table(collection).get(id);
}

/**
 * Insert a new record (or replace if same PK exists).
 * @param {string} collection
 * @param {Object} data — must include an `id` field
 * @returns {Promise<string>} the id of the inserted record
 */
export async function insert(collection, data) {
  await table(collection).put(data);
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
  return table(collection).update(id, changes);
}

/**
 * Delete a record by primary key.
 * @param {string} collection
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(collection, id) {
  return table(collection).delete(id);
}

/**
 * Bulk-insert records (used for seeding).
 * @param {string} collection
 * @param {Array<Object>} records
 * @returns {Promise<void>}
 */
export async function bulkInsert(collection, records) {
  return table(collection).bulkPut(records);
}

/**
 * Check if a collection has any data.
 * @param {string} collection
 * @returns {Promise<boolean>}
 */
export async function isEmpty(collection) {
  const count = await table(collection).count();
  return count === 0;
}

/**
 * Clear all data in a specific collection.
 * @param {string} collection
 * @returns {Promise<void>}
 */
export async function clearCollection(collection) {
  return table(collection).clear();
}

/**
 * Clear the entire database (all tables).
 * Useful for testing or full reset.
 * @returns {Promise<void>}
 */
export async function clearAll() {
  const tables = Object.values(TABLE_MAP);
  await Promise.all(tables.map(t => db[t].clear()));
}
