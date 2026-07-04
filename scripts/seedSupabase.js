import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Mock Data
import { users, clients, vehicles, routes, trips, income, expenses, expenseCategories, fuelRecords, maintenance, vehicleDocuments, auditLogs } from '../src/data/seedData.js';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  global: { fetch: fetch }, // Just standard fetch
  realtime: {
    transport: WebSocket
  }
});

async function seed() {
  console.log("Seeding Supabase Database with Auth Users...");

  // 1. Create Supabase Auth users and map their mock IDs to UUIDs
  const userIdMap = {};
  for (const user of users) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name, role: user.role }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
         // If they already exist, we need to fetch their UUID
         // We can list users or try to find them, but for seeding simplicity we'll just skip or fetch
         const { data: existingUsers } = await supabase.auth.admin.listUsers();
         const existingUser = existingUsers.users.find(u => u.email === user.email);
         if (existingUser) {
           userIdMap[user.id] = existingUser.id;
         }
      } else {
        console.error(`Error creating auth user ${user.email}:`, authError.message);
      }
    } else if (authUser && authUser.user) {
      userIdMap[user.id] = authUser.user.id;
      console.log(`Created auth user: ${user.email} -> ${authUser.user.id}`);
    }
  }

  // 2. Replace IDs in the 'users' array
  const mappedUsers = users.map(u => ({
    ...u,
    id: userIdMap[u.id] || u.id // Fallback to original if something failed
  }));

  // 3. Replace foreign keys in other collections
  const mappedVehicles = vehicles.map(v => ({
    ...v,
    assigned_driver_id: v.assigned_driver_id ? (userIdMap[v.assigned_driver_id] || v.assigned_driver_id) : null
  }));

  const mappedTrips = trips.map(t => ({
    ...t,
    driver_id: t.driver_id ? (userIdMap[t.driver_id] || t.driver_id) : null
  }));

  const mappedExpenses = expenses.map(e => ({
    ...e,
    driver_id: e.driver_id ? (userIdMap[e.driver_id] || e.driver_id) : null
  }));

  const mappedFuel = fuelRecords.map(f => ({
    ...f,
    recorded_by: f.recorded_by ? (userIdMap[f.recorded_by] || f.recorded_by) : null
  }));

  const mappedAudit = auditLogs.map(a => ({
    ...a,
    user_id: a.user_id ? (userIdMap[a.user_id] || a.user_id) : null
  }));

  const collections = {
    users: mappedUsers,
    clients,
    vehicles: mappedVehicles,
    routes,
    trips: mappedTrips,
    income,
    expense_categories: expenseCategories,
    expenses: mappedExpenses,
    fuel_records: mappedFuel,
    maintenance,
    vehicle_documents: vehicleDocuments,
    audit_logs: mappedAudit,
  };

  for (const [table, records] of Object.entries(collections)) {
    if (!records || records.length === 0) continue;
    
    console.log(`Inserting ${records.length} records into '${table}'...`);
    const { error } = await supabase.from(table).upsert(records);
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error.message);
    } else {
      console.log(`✓ ${table} seeded successfully.`);
    }
  }

  console.log("Database seeded successfully.");
}

seed().catch(console.error);
