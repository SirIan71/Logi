/**
 * SIRIAN — Role-Based Access Control Configuration
 *
 * Centralised permissions matrix for all four roles:
 *   admin, finance, operations, driver
 *
 * Access levels:
 *   'full'  — Full CRUD access
 *   'read'  — Read-only (no add/edit/delete)
 *   'own'   — Can only see/manage own records (drivers)
 *   'none'  — No access (page hidden + route blocked)
 */

// ── Permissions Matrix ────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  admin: {
    dashboard:  'full',
    trips:      'full',
    routes:     'full',
    fleet:      'full',
    drivers:    'full',
    clients:    'full',
    income:     'full',
    fuel:       'full',
    expenses:   'full',
    reports:    'full',
    'audit-log':'full',
    settings:   'full',
  },
  finance: {
    dashboard:  'full',
    trips:      'read',
    routes:     'none',
    fleet:      'none',
    drivers:    'none',
    clients:    'read',
    income:     'full',
    fuel:       'full',
    expenses:   'full',
    reports:    'read',
    'audit-log':'none',
    settings:   'read', // limited — no user management
  },
  operations: {
    dashboard:  'full',
    trips:      'full',
    routes:     'full',
    fleet:      'full',
    drivers:    'full',
    clients:    'full',
    income:     'none',
    fuel:       'read',
    expenses:   'none',
    reports:    'read',
    'audit-log':'none',
    settings:   'read', // limited — no user management
  },
  driver: {
    dashboard:  'own',  // personal dashboard
    trips:      'own',  // own trips only
    routes:     'own',  // own routes only
    fleet:      'none',
    drivers:    'none',
    clients:    'none',
    income:     'none',
    fuel:       'own',  // log own fuel only
    expenses:   'none',
    reports:    'none',
    'audit-log':'none',
    settings:   'read', // appearance + notifications only
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get the access level for a given role and page.
 * @param {string} role   — 'admin' | 'finance' | 'operations' | 'driver'
 * @param {string} page   — route key, e.g. 'trips', 'fuel', 'audit-log'
 * @returns {'full'|'read'|'own'|'none'}
 */
export function getAccessLevel(role, page) {
  return ROLE_PERMISSIONS[role]?.[page] ?? 'none';
}

/**
 * Whether a user with the given role can navigate to a page at all.
 */
export function canAccess(role, page) {
  return getAccessLevel(role, page) !== 'none';
}

// ── Navigation Items ──────────────────────────────────────────────────────────
// Master list of all sidebar navigation entries, grouped by section.

const ALL_NAV_ITEMS = [
  // Overview
  { path: '/', label: 'Dashboard', icon: 'dashboard', group: 'Overview', page: 'dashboard' },
  // Operations
  { path: '/trips', label: 'Trips', icon: 'route', group: 'Operations', page: 'trips' },
  { path: '/routes', label: 'Routes', icon: 'map', group: 'Operations', page: 'routes' },
  { path: '/fleet', label: 'Fleet', icon: 'local_shipping', group: 'Operations', page: 'fleet' },
  { path: '/drivers', label: 'Drivers', icon: 'badge', group: 'Operations', page: 'drivers' },
  { path: '/clients', label: 'Clients', icon: 'group', group: 'Operations', page: 'clients' },
  // Finance
  { path: '/income', label: 'Income', icon: 'payments', group: 'Finance', page: 'income' },
  { path: '/fuel', label: 'Fuel', icon: 'gas_meter', group: 'Finance', page: 'fuel' },
  { path: '/expenses', label: 'Expenses', icon: 'receipt_long', group: 'Finance', page: 'expenses' },
  // Footer
  { path: '/reports', label: 'Reports', icon: 'assessment', group: 'footer', page: 'reports' },
  { path: '/audit-log', label: 'Audit Log', icon: 'history', group: 'footer', page: 'audit-log' },
  { path: '/settings', label: 'Settings', icon: 'settings', group: 'footer', page: 'settings' },
];

/**
 * Returns filtered navigation items for a given role.
 * Items the role cannot access are removed.
 */
export function getNavItems(role) {
  return ALL_NAV_ITEMS.filter(item => canAccess(role, item.page));
}

/**
 * Returns grouped navigation items for sidebar rendering.
 * @returns {{ group: string, items: Array }}[]
 */
export function getGroupedNavItems(role) {
  const items = getNavItems(role);
  const groups = [];
  const groupMap = {};

  items.forEach(item => {
    if (!groupMap[item.group]) {
      groupMap[item.group] = [];
      groups.push(item.group);
    }
    groupMap[item.group].push(item);
  });

  return groups.map(group => ({ group, items: groupMap[group] }));
}
