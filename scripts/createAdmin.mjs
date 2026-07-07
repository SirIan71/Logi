/**
 * SIRIAN — One-time Admin Setup Script
 *
 * This script:
 * 1. Clears ALL existing dummy data from Supabase tables
 * 2. Seeds default expense categories
 * 3. Creates the admin user in Supabase Auth (which triggers auto-profile creation)
 *
 * Usage:
 *   node scripts/createAdmin.mjs
 *
 * Requires: SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

// ── Load env vars from .env.local ────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

// Use the service role key for admin operations (ws needed for Node.js < 22)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// ── Config ───────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'iangamer375@gmail.com';
const ADMIN_PASSWORD = 'SirianAdmin2026!'; // Change this after first login!
const ADMIN_NAME = 'Admin';

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

// ── Tables to clear (order matters due to foreign keys) ──────────────────────
const TABLES_TO_CLEAR = [
  'audit_logs',
  'fuel_records',
  'vehicle_documents',
  'maintenance',
  'expenses',
  'income',
  'trips',
  'vehicles',
  'routes',
  'clients',
  'expense_categories',
  'users',
];

async function main() {
  console.log('🚀 SIRIAN Admin Setup Script');
  console.log('========================================\n');

  // ── Step 1: Clear all existing data ──────────────────────────────────────
  console.log('🗑️  Step 1: Clearing all existing data...');
  for (const table of TABLES_TO_CLEAR) {
    const { error } = await supabase.from(table).delete().neq('id', '___never_match___');
    if (error) {
      console.error(`   ❌ Error clearing ${table}:`, error.message);
    } else {
      console.log(`   ✓ Cleared ${table}`);
    }
  }

  // Also clear any existing auth users
  console.log('\n🗑️  Clearing existing auth users...');
  const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
  if (existingAuthUsers?.users?.length) {
    for (const user of existingAuthUsers.users) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        console.error(`   ❌ Error deleting auth user ${user.email}:`, error.message);
      } else {
        console.log(`   ✓ Deleted auth user: ${user.email}`);
      }
    }
  } else {
    console.log('   (No existing auth users found)');
  }

  // ── Step 2: Seed expense categories ────────────────────────────────────
  console.log('\n📦 Step 2: Seeding default expense categories...');
  const { error: catError } = await supabase
    .from('expense_categories')
    .upsert(DEFAULT_EXPENSE_CATEGORIES);
  if (catError) {
    console.error('   ❌ Error seeding categories:', catError.message);
  } else {
    console.log(`   ✓ ${DEFAULT_EXPENSE_CATEGORIES.length} expense categories seeded`);
  }

  // ── Step 3: Create admin auth user ─────────────────────────────────────
  console.log('\n👤 Step 3: Creating admin user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Auto-confirm so they can log in immediately
    user_metadata: {
      name: ADMIN_NAME,
      role: 'admin',
    },
  });

  if (authError) {
    console.error('   ❌ Error creating admin auth user:', authError.message);
    process.exit(1);
  }

  console.log(`   ✓ Auth user created: ${authData.user.email} (ID: ${authData.user.id})`);

  // ── Step 4: Verify profile was auto-created by trigger ─────────────────
  console.log('\n🔍 Step 4: Verifying profile was auto-created...');
  // Give the trigger a moment
  await new Promise(r => setTimeout(r, 2000));

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authData.user.id)
    .single();

  if (profileError || !profile) {
    console.warn('   ⚠️  Profile not auto-created by trigger. Creating manually...');
    const { error: manualError } = await supabase.from('users').insert({
      id: authData.user.id,
      auth_id: authData.user.id,
      email: ADMIN_EMAIL,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
    });
    if (manualError) {
      console.error('   ❌ Error creating profile:', manualError.message);
    } else {
      console.log('   ✓ Profile created manually');
    }
  } else {
    // Update the role to admin (trigger defaults may vary)
    await supabase.from('users').update({ role: 'admin', first_name: 'Admin', last_name: 'User' }).eq('id', profile.id);
    console.log(`   ✓ Profile exists: ${profile.email} (role: admin)`);
  }

  // ── Done ───────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('✅ Setup complete!\n');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n   ⚠️  Change this password after your first login!');
  console.log('   You can now deploy to Vercel and log in.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
