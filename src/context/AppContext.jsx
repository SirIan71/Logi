import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { getAll, insert, update as dbUpdate, remove as dbRemove } from '../lib/dataService.js';
import db from '../lib/db.js';
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
    case 'LOGOUT': return initialState;
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_COLLECTION': return { ...state, [action.collection]: action.payload };
    case 'ADD_ITEM': return { ...state, [action.collection]: [...state[action.collection], action.payload] };
    case 'UPDATE_ITEM': return { ...state, [action.collection]: state[action.collection].map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'DELETE_ITEM': return { ...state, [action.collection]: state[action.collection].filter(i => i.id !== action.payload.id) };
    default: return state;
  }
}

/**
 * Load all collections from Supabase into React state.
 */
async function loadAllCollections(dispatch) {
  for (const name of COLLECTIONS) {
    const data = await getAll(name);
    dispatch({ type: 'SET_COLLECTION', collection: name, payload: data });
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  // ── Initialise: restore session & load data ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Check for an existing auth session (e.g. page refresh)
        const { data: { session } } = await db.auth.getSession();

        if (session) {
          // User is already authenticated — fetch their profile
          let userRecord = null;
          // Try auth_id lookup first, fall back to email if column doesn't exist yet
          const { data: byAuthId, error: authIdErr } = await db
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();
          
          if (byAuthId) {
            userRecord = byAuthId;
          } else {
            // Fallback: match by email (before migration is applied)
            const { data: byEmail } = await db
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .single();
            userRecord = byEmail;
          }

          if (userRecord && !cancelled) {
            dispatch({ type: 'LOGIN', payload: userRecord });
          }
        }

        // Only seed and load data if the user is authenticated (RLS requires it)
        if (session && !cancelled) {
          await seedDatabase();
          await loadAllCollections(dispatch);
        }

        if (!cancelled) setDbReady(true);
      } catch (err) {
        console.error('[SIRIAN DB] Initialisation failed:', err);
        if (!cancelled) setDbError(err.message);
      }
    }

    init();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'SIGNED_IN' && session) {
        // Fetch the user profile (try auth_id first, then email)
        let userRecord = null;
        const { data: byAuthId } = await db
          .from('users').select('*').eq('auth_id', session.user.id).single();
        if (byAuthId) {
          userRecord = byAuthId;
        } else {
          const { data: byEmail } = await db
            .from('users').select('*').eq('email', session.user.email).single();
          userRecord = byEmail;
        }

        if (userRecord && !cancelled) {
          dispatch({ type: 'LOGIN', payload: userRecord });
          await loadAllCollections(dispatch);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array — runs once on mount

  // ── Auth ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        console.error('Login error:', error?.message);
        return false;
      }

      // Fetch user record (try auth_id first, then email)
      let userRecord = null;
      const { data: byAuthId } = await db
        .from('users').select('*').eq('auth_id', data.user.id).single();
      if (byAuthId) {
        userRecord = byAuthId;
      } else {
        const { data: byEmail } = await db
          .from('users').select('*').eq('email', email).single();
        userRecord = byEmail;
      }

      if (userRecord) {
        dispatch({ type: 'LOGIN', payload: userRecord });
        // After login, RLS is now active for this user — load all data
        await loadAllCollections(dispatch);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await db.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);

  // ── Toast Notifications ────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const getCollectionLabel = (col) => {
    const labels = {
      users: 'User',
      clients: 'Client',
      vehicles: 'Vehicle',
      routes: 'Route',
      trips: 'Trip',
      income: 'Income transaction',
      expenses: 'Expense',
      expenseCategories: 'Expense Category',
      fuelRecords: 'Fuel Record',
      maintenance: 'Maintenance Service',
      vehicleDocuments: 'Vehicle Document',
    };
    return labels[col] || col;
  };

  // ── CRUD — writes to Supabase first, then updates React state ──────────
  const addItem = useCallback(async (collection, item) => {
    try {
      await insert(collection, item);
      dispatch({ type: 'ADD_ITEM', collection, payload: item });
      showToast(`${getCollectionLabel(collection)} added successfully!`, 'success');
    } catch (err) {
      console.error(`[SIRIAN DB] Failed to add to ${collection}:`, err);
      showToast(`Failed to add ${getCollectionLabel(collection).toLowerCase()}.`, 'error');
    }
  }, [showToast]);

  const updateItem = useCallback(async (collection, item) => {
    try {
      const { id, ...changes } = item;
      await dbUpdate(collection, id, changes);
      dispatch({ type: 'UPDATE_ITEM', collection, payload: item });
      showToast(`${getCollectionLabel(collection)} updated successfully!`, 'success');
    } catch (err) {
      console.error(`[SIRIAN DB] Failed to update ${collection}:`, err);
      showToast(`Failed to update ${getCollectionLabel(collection).toLowerCase()}.`, 'error');
    }
  }, [showToast]);

  const deleteItem = useCallback(async (collection, id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await dbRemove(collection, id);
        dispatch({ type: 'DELETE_ITEM', collection, payload: { id } });
        showToast(`${getCollectionLabel(collection)} deleted successfully!`, 'success');
      } catch (err) {
        console.error(`[SIRIAN DB] Failed to delete from ${collection}:`, err);
        showToast(`Failed to delete ${getCollectionLabel(collection).toLowerCase()}.`, 'error');
      }
    }
  }, [showToast]);

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
          Failed to connect to the database. Please check your internet connection and try again.
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
        <p style={{ color: '#94a3b8' }}>Connecting to SIRIAN…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ ...state, login, logout, toggleSidebar, addItem, updateItem, deleteItem, lookup, showToast, dispatch }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <div className="toast-content">
              {t.type === 'success' && <span className="material-symbols-outlined" style={{color: 'var(--color-success)'}}>check_circle</span>}
              {t.type === 'error' && <span className="material-symbols-outlined" style={{color: 'var(--color-danger)'}}>error</span>}
              {t.type === 'info' && <span className="material-symbols-outlined" style={{color: 'var(--color-info)'}}>info</span>}
              {t.type === 'warning' && <span className="material-symbols-outlined" style={{color: 'var(--color-warning)'}}>warning</span>}
              <span>{t.message}</span>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="toast-close">
              <span className="material-symbols-outlined" style={{fontSize: 18}}>close</span>
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
