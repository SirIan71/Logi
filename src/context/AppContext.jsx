import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { getAll, insert, update as dbUpdate, remove as dbRemove } from '../lib/dataService.js';
import { seedDatabase } from '../lib/seedDatabase.js';

const AppContext = createContext();

const COLLECTIONS = [
  'users', 'clients', 'vehicles', 'routes', 'trips',
  'income', 'expenses', 'expenseCategories',
  'fuelRecords', 'maintenance', 'vehicleDocuments', 'auditLogs',
];

const initialState = {
  user: null,
  users: [], clients: [], vehicles: [], routes: [], trips: [],
  income: [], expenses: [], expenseCategories: [],
  fuelRecords: [], maintenance: [], vehicleDocuments: [], auditLogs: [],
  sidebarOpen: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': return { ...state, user: action.payload };
    case 'LOGOUT': return { ...state, user: null };
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_COLLECTION': return { ...state, [action.collection]: action.payload };
    case 'ADD_ITEM': return { ...state, [action.collection]: [...state[action.collection], action.payload] };
    case 'UPDATE_ITEM': return { ...state, [action.collection]: state[action.collection].map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'DELETE_ITEM': return { ...state, [action.collection]: state[action.collection].filter(i => i.id !== action.payload.id) };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  // ── Initialise database and load all data ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Seed database on first launch (no-op if already seeded)
        await seedDatabase();

        // Load every collection from IndexedDB into state
        for (const name of COLLECTIONS) {
          const data = await getAll(name);
          if (!cancelled) {
            dispatch({ type: 'SET_COLLECTION', collection: name, payload: data });
          }
        }

        if (!cancelled) setDbReady(true);
      } catch (err) {
        console.error('[SIRIAN DB] Initialisation failed:', err);
        if (!cancelled) setDbError(err.message);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────
  const login = useCallback((email, password) => {
    const u = state.users.find(u => u.email === email && u.password === password);
    if (u) { dispatch({ type: 'LOGIN', payload: u }); return true; }
    return false;
  }, [state.users]);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);

  // ── CRUD — writes to IndexedDB first, then updates React state ────────
  const addItem = useCallback(async (collection, item) => {
    try {
      await insert(collection, item);
      dispatch({ type: 'ADD_ITEM', collection, payload: item });
    } catch (err) {
      console.error(`[SIRIAN DB] Failed to add to ${collection}:`, err);
    }
  }, []);

  const updateItem = useCallback(async (collection, item) => {
    try {
      const { id, ...changes } = item;
      await dbUpdate(collection, id, changes);
      dispatch({ type: 'UPDATE_ITEM', collection, payload: item });
    } catch (err) {
      console.error(`[SIRIAN DB] Failed to update ${collection}:`, err);
    }
  }, []);

  const deleteItem = useCallback(async (collection, id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await dbRemove(collection, id);
        dispatch({ type: 'DELETE_ITEM', collection, payload: { id } });
      } catch (err) {
        console.error(`[SIRIAN DB] Failed to delete from ${collection}:`, err);
      }
    }
  }, []);

  const lookup = useCallback((collection, id) => state[collection]?.find(i => i.id === id), [state]);

  // ── Loading / error states ─────────────────────────────────────────────
  if (dbError) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f172a', color: '#f87171',
        fontFamily: 'Inter, system-ui, sans-serif', flexDirection: 'column', gap: '1rem',
      }}>
        <h2 style={{ margin: 0 }}>Database Error</h2>
        <p style={{ color: '#94a3b8', maxWidth: 480, textAlign: 'center' }}>
          Failed to initialise the local database. This usually means your browser doesn't support IndexedDB or storage is full.
        </p>
        <code style={{ background: '#1e293b', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
          {dbError}
        </code>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f172a', color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif', flexDirection: 'column', gap: '1rem',
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #334155',
          borderTopColor: '#3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#94a3b8' }}>Initialising database…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ ...state, login, logout, toggleSidebar, addItem, updateItem, deleteItem, lookup, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
