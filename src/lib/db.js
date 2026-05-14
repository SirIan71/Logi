/**
 * SIRIAN Local Database — Dexie.js (IndexedDB)
 *
 * This module defines the database schema for local persistence.
 * When ready for production, swap this file for a Supabase client
 * and the dataService layer will remain identical.
 */
import Dexie from 'dexie';

const db = new Dexie('SirianDB');

// Schema version 1 — mirrors the seedData.js structure
// Only indexed/searchable fields are listed; all other fields are stored automatically.
db.version(1).stores({
  users:              'id, email, role, is_active',
  clients:            'id, company_name, status, contract_type',
  vehicles:           'id, registration, status, assigned_driver_id',
  routes:             'id, name, origin, destination',
  trips:              'id, route_id, vehicle_id, driver_id, client_id, status, departure_date',
  income:             'id, trip_id, client_id, invoice_number, payment_status, due_date',
  expense_categories: 'id, name',
  expenses:           'id, trip_id, vehicle_id, driver_id, category_id, approval_status, expense_date',
  fuel_records:       'id, vehicle_id, trip_id, date',
  maintenance:        'id, vehicle_id, service_date, next_due_date',
  vehicle_documents:  'id, vehicle_id, doc_type, expiry_date',
  audit_logs:         'id, user_id, entity_type, entity_id, action, created_at',
});

export default db;
