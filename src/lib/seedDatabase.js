/**
 * SIRIAN Database Seeder
 *
 * Seeds the local IndexedDB with the data from seedData.js.
 * Only runs if the database is empty (first launch or after a reset).
 */
import {
  users, clients, vehicles, routes, trips,
  income, expenses, expenseCategories,
  fuelRecords, maintenance, vehicleDocuments, auditLogs,
} from '../data/seedData.js';
import { bulkInsert, isEmpty } from './dataService.js';

/**
 * Seed all collections if the database is empty.
 * Returns true if seeding was performed, false if skipped.
 */
export async function seedDatabase() {
  // Check if the DB already has data (use 'users' as a canary)
  const dbEmpty = await isEmpty('users');

  if (!dbEmpty) {
    console.log('[SIRIAN DB] Database already seeded — skipping.');
    return false;
  }

  console.log('[SIRIAN DB] Seeding database with initial data…');

  const collections = {
    users,
    clients,
    vehicles,
    routes,
    trips,
    income,
    expenses,
    expenseCategories,
    fuelRecords,
    maintenance,
    vehicleDocuments,
    auditLogs,
  };

  for (const [name, records] of Object.entries(collections)) {
    await bulkInsert(name, records);
    console.log(`  ✓ ${name}: ${records.length} records`);
  }

  console.log('[SIRIAN DB] Seeding complete.');
  return true;
}

/**
 * Force re-seed: clears existing data and re-inserts seed data.
 * Useful for development/testing resets.
 */
export async function reseedDatabase() {
  const { clearAll } = await import('./dataService.js');
  console.log('[SIRIAN DB] Clearing all data…');
  await clearAll();
  return seedDatabase();
}
