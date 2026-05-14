# SIRIAN — Logistics Management System

SIRIAN is a web-based logistics and fleet management application designed for transport businesses. It provides a single dashboard to manage trips, routes, vehicles, drivers, clients, and financials — giving operators full visibility over day-to-day operations and business performance.

## Features

- **Dashboard** — Real-time overview with KPI cards, revenue vs. expenses charts, and recent activity.
- **Trips** — Create, track, and manage individual trips with route, vehicle, and driver assignments.
- **Routes** — Define and maintain frequently-used routes.
- **Fleet** — Register and monitor vehicles, track status and service history.
- **Drivers** — Manage driver records and assignments.
- **Clients** — Maintain a client database for billing and trip association.
- **Income & Expenses** — Record revenue and costs; track profitability.
- **Fuel** — Log fuel purchases and consumption per vehicle.
- **Reports** — Generate summaries and analytics across all modules.
- **Audit Log** — View a history of changes made within the system.
- **Settings** — Configure application preferences and user accounts.
- **Authentication** — Simple login gate to protect the application.

## Tech Stack

| Layer       | Technology                                   |
| ----------- | -------------------------------------------- |
| Framework   | React 19 (Vite 8)                            |
| Routing     | React Router v7                              |
| Database    | Dexie.js (IndexedDB) → Supabase (production) |
| Styling     | Tailwind CSS 3                               |
| Charts      | Chart.js + react-chartjs-2                   |
| Icons       | Lucide React, Material Symbols               |
| Fonts       | Plus Jakarta Sans, Inter (Google Fonts)       |
| Analytics   | Vercel Speed Insights                        |

## Database

SIRIAN uses **Dexie.js** (an IndexedDB wrapper) for local data persistence. Data is stored in the browser and survives page refreshes, tab closes, and browser restarts.

### How it works

1. On first launch, the app seeds IndexedDB with the demo data from `src/data/seedData.js`.
2. All CRUD operations (create, update, delete) are written to IndexedDB first, then reflected in React state.
3. The data service layer (`src/lib/dataService.js`) provides a generic API that can be swapped for Supabase when ready for production.

### Architecture

```
src/lib/
├── db.js             # Dexie schema definition (tables & indexes)
├── dataService.js    # Generic CRUD functions (getAll, insert, update, remove)
└── seedDatabase.js   # First-launch seeder
```

### Resetting the database

Open the browser console and run:

```js
import('/src/lib/seedDatabase.js').then(m => m.reseedDatabase())
```

### Migration to Supabase (production)

When ready for production, replace `src/lib/dataService.js` with Supabase client calls. The function signatures are identical — no changes needed in `AppContext` or any page component.

**1. Install dependencies & initialise:**

```bash
npm install @supabase/supabase-js
npm install -D supabase
npx supabase init
npx supabase start   # requires Docker
```

**2. Create `src/lib/supabase.js`:**

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**3. Replace `src/lib/dataService.js`:**

```js
import { supabase } from './supabase.js'

// Collection name → Supabase table name (snake_case)
const TABLE_MAP = {
  users: 'users',  clients: 'clients',  vehicles: 'vehicles',
  routes: 'routes',  trips: 'trips',  income: 'income',
  expenseCategories: 'expense_categories',  expenses: 'expenses',
  fuelRecords: 'fuel_records',  maintenance: 'maintenance',
  vehicleDocuments: 'vehicle_documents',  auditLogs: 'audit_logs',
}

function tableName(collection) {
  return TABLE_MAP[collection] ?? collection
}

export async function getAll(collection) {
  const { data, error } = await supabase.from(tableName(collection)).select('*')
  if (error) throw error
  return data
}

export async function getById(collection, id) {
  const { data, error } = await supabase.from(tableName(collection)).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function insert(collection, item) {
  const { error } = await supabase.from(tableName(collection)).insert(item)
  if (error) throw error
  return item.id
}

export async function update(collection, id, changes) {
  const { error } = await supabase.from(tableName(collection)).update(changes).eq('id', id)
  if (error) throw error
  return 1
}

export async function remove(collection, id) {
  const { error } = await supabase.from(tableName(collection)).delete().eq('id', id)
  if (error) throw error
}

export async function bulkInsert(collection, records) {
  const { error } = await supabase.from(tableName(collection)).insert(records)
  if (error) throw error
}

export async function isEmpty(collection) {
  const { count, error } = await supabase.from(tableName(collection)).select('*', { count: 'exact', head: true })
  if (error) throw error
  return count === 0
}
```

**4. Add `.env.local`:**

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321          # local
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...             # from supabase start output
```

> **Note:** No changes are needed in `AppContext.jsx`, `seedDatabase.js`, or any page component — they all use `dataService.js` which is the only file that gets swapped.

## Users & Roles

The app ships with the following demo accounts. Use these credentials to log in and explore different permission levels.

### Role Permissions

| Capability                          | Admin | Finance | Operations |
| ----------------------------------- | :---: | :-----: | :--------: |
| Dashboard (full KPIs & charts)      |  ✅   |   ✅    |     ✅     |
| Trips — manage & view               |  ✅   |   ✅    |     ✅     |
| Routes — manage & view              |  ✅   |   ✅    |     ✅     |
| Routes — financial data (profit, tolls) |  ✅   |   ✅    |     ❌     |
| Fleet — manage vehicles             |  ✅   |   ✅    |     ✅     |
| Drivers — manage records            |  ✅   |   ✅    |     ✅     |
| Clients — manage records            |  ✅   |   ✅    |     ✅     |
| Income — view & manage              |  ✅   |   ✅    |     ❌     |
| Expenses — view & manage            |  ✅   |   ✅    |     ❌     |
| Fuel — log & view records           |  ✅   |   ✅    |     ✅     |
| Reports — generate & view           |  ✅   |   ✅    |     ✅     |
| Audit Log — view history            |  ✅   |   ✅    |     ✅     |
| Settings — configure app            |  ✅   |   ❌    |     ❌     |

> **Note:** The operations role is intentionally restricted from viewing financial data (income, expenses, route profitability) to protect sensitive business information.

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)

### Installation

```bash
# Clone the repository
git clone https://github.com/SirIan71/Logi.git
cd SIRIAN

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

The app will start on [http://localhost:5173](http://localhost:5173) (default Vite port).

### Building for Production

```bash
npm run build
```

The optimised bundle is output to the `dist/` directory. You can preview it with:

```bash
npm run preview
```

## Project Structure

```
SIRIAN/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images and media
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   └── layout/          # App shell (sidebar, header)
│   ├── context/             # React context (global state)
│   ├── data/                # Seed / mock data
│   ├── lib/                 # Database & data service layer
│   ├── pages/               # Route-level page components
│   ├── utils/               # Helper functions
│   ├── App.jsx              # Root component & route definitions
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles & Tailwind directives
├── index.html               # HTML template
├── tailwind.config.js       # Tailwind configuration
├── vite.config.js           # Vite configuration
└── package.json
```

## License

This project is proprietary. All rights reserved.
