/**
 * SIRIAN Database Seeder
 *
 * Seeds the Supabase database with essential reference data only.
 * Only runs if the expense_categories table is empty (first launch).
 *
 * All user/business data is created by real users through the app.
 */
import { bulkInsert, isEmpty } from './dataService.js';

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'ec1', name: 'Fuel', default_redeemable: false, icon: 'Fuel' },
  { id: 'ec2', name: 'Repairs & Maintenance', default_redeemable: false, icon: 'Wrench' },
  { id: 'ec3', name: 'Tolls', default_redeemable: true, icon: 'CircleDollarSign' },
  { id: 'ec4', name: 'Driver Allowances', default_redeemable: false, icon: 'Wallet' },
  { id: 'ec5', name: 'Parking', default_redeemable: true, icon: 'ParkingCircle' },
  { id: 'ec6', name: 'Loading / Offloading', default_redeemable: true, icon: 'Package' },
  { id: 'ec7', name: 'Insurance', default_redeemable: false, icon: 'Shield' },
  { id: 'ec8', name: 'Licenses & Permits', default_redeemable: false, icon: 'FileText' },
  { id: 'ec9', name: 'Fines & Penalties', default_redeemable: false, icon: 'AlertTriangle' },
  { id: 'ec10', name: 'Miscellaneous', default_redeemable: false, icon: 'MoreHorizontal' },
  { id: 'ec11', name: 'Car Wash', default_redeemable: false, icon: 'Droplets' },
];

/**
 * Seed essential reference data if the database is empty.
 * Returns true if seeding was performed, false if skipped.
 */
export async function seedDatabase() {
  const categoriesEmpty = await isEmpty('expenseCategories');

  if (!categoriesEmpty) {
    console.log('[SIRIAN DB] Reference data already exists — skipping seed.');
    return false;
  }

  console.log('[SIRIAN DB] Seeding default expense categories…');
  await bulkInsert('expenseCategories', DEFAULT_EXPENSE_CATEGORIES);
  console.log(`  ✓ expenseCategories: ${DEFAULT_EXPENSE_CATEGORIES.length} records`);

  console.log('[SIRIAN DB] Seeding complete.');
  return true;
}
