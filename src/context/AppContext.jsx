import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { getAll, insert, update as dbUpdate, remove as dbRemove } from '../lib/dataService.js';
import db from '../lib/db.js';
import { seedDatabase } from '../lib/seedDatabase.js';

const AppContext = createContext();

const COLLECTIONS = [
  'users', 'clients', 'vehicles', 'routes', 'trips',
  'income', 'expenses', 'expenseCategories',
  'fuelRecords', 'maintenance', 'vehicleDocuments', 'auditLogs', 'workshops',
];

const initialState = {
  user: null,
  users: [], clients: [], vehicles: [], routes: [], trips: [],
  income: [], expenses: [], expenseCategories: [],
  fuelRecords: [], maintenance: [], vehicleDocuments: [], auditLogs: [], workshops: [],
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
 * Load all collections from Supabase into React state in parallel.
 */
async function loadAllCollections(dispatch) {
  const results = await Promise.all(
    COLLECTIONS.map(async (name) => {
      try {
        const data = await getAll(name);
        return { name, data };
      } catch (err) {
        console.error(`[SIRIAN DB] Error loading collection ${name}:`, err);
        return { name, data: [] };
      }
    })
  );
  for (const { name, data } of results) {
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

        // Audit log login
        const logId = 'al_' + Math.random().toString(36).substr(2, 9);
        const logRecord = {
          id: logId,
          user_id: userRecord.id,
          entity_type: 'Auth',
          entity_id: userRecord.id,
          action: 'login',
          old_values: null,
          new_values: { email: userRecord.email },
          created_at: new Date().toISOString()
        };
        try {
          await insert('auditLogs', logRecord);
          dispatch({ type: 'ADD_ITEM', collection: 'auditLogs', payload: logRecord });
        } catch (logErr) {
          console.error('[SIRIAN DB] Failed to write login audit log:', logErr);
        }

        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const loggingUser = state.user;
    await db.auth.signOut();
    dispatch({ type: 'LOGOUT' });

    if (loggingUser) {
      const logId = 'al_' + Math.random().toString(36).substr(2, 9);
      const logRecord = {
        id: logId,
        user_id: loggingUser.id,
        entity_type: 'Auth',
        entity_id: loggingUser.id,
        action: 'logout',
        old_values: null,
        new_values: { email: loggingUser.email },
        created_at: new Date().toISOString()
      };
      try {
        await insert('auditLogs', logRecord);
      } catch (logErr) {
        console.error('[SIRIAN DB] Failed to write logout audit log:', logErr);
      }
    }
  }, [state.user]);

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
      workshops: 'Workshop',
    };
    return labels[col] || col;
  };

  // ── Generic Audit Logging Function ─────────────────────────────────────
  const writeAuditLog = useCallback(async ({ action, entityType, entityId, oldValues, newValues }) => {
    try {
      const logId = 'al_' + Math.random().toString(36).substr(2, 9);
      const logRecord = {
        id: logId,
        user_id: state.user?.id || null,
        entity_type: entityType,
        entity_id: entityId || null,
        action,
        old_values: oldValues || null,
        new_values: newValues || null,
        created_at: new Date().toISOString()
      };
      await insert('auditLogs', logRecord);
      dispatch({ type: 'ADD_ITEM', collection: 'auditLogs', payload: logRecord });
    } catch (err) {
      console.error('[SIRIAN DB] Failed to write audit log:', err);
    }
  }, [state.user]);

  // ── CRUD — updates React state immediately, then syncs to Supabase ──────────
  const addItem = useCallback(async (collection, item) => {
    // Optimistically place record into React state & UI tables
    dispatch({ type: 'ADD_ITEM', collection, payload: item });

    try {
      await insert(collection, item);
      showToast(`${getCollectionLabel(collection)} added successfully!`, 'success');

      if (collection !== 'auditLogs') {
        await writeAuditLog({
          action: 'create',
          entityType: getCollectionLabel(collection),
          entityId: item.id,
          oldValues: null,
          newValues: item
        });
      }
    } catch (err) {
      console.error(`[SIRIAN DB] Failed to sync ${collection} to Supabase:`, err);
      dispatch({ type: 'DELETE_ITEM', collection, payload: { id: item.id } });
      showToast(`Failed to save ${getCollectionLabel(collection).toLowerCase()} to database: ${err.message || 'Sync error'}`, 'error');
      throw err;
    }
  }, [showToast, writeAuditLog]);

  const updateItem = useCallback(async (collection, item) => {
    try {
      const { id, ...changes } = item;
      const oldItem = state[collection]?.find(i => i.id === id) || null;
      await dbUpdate(collection, id, changes);
      dispatch({ type: 'UPDATE_ITEM', collection, payload: item });
      showToast(`${getCollectionLabel(collection)} updated successfully!`, 'success');

      if (collection !== 'auditLogs') {
        await writeAuditLog({
          action: 'update',
          entityType: getCollectionLabel(collection),
          entityId: id,
          oldValues: oldItem,
          newValues: item
        });
      }
    } catch (err) {
      console.error(`[SIRIAN DB] Failed to update ${collection}:`, err);
      showToast(`Failed to update ${getCollectionLabel(collection).toLowerCase()}.`, 'error');
    }
  }, [showToast, writeAuditLog, state]);

  const deleteItem = useCallback(async (collection, id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const oldItem = state[collection]?.find(i => i.id === id) || null;
        await dbRemove(collection, id);
        dispatch({ type: 'DELETE_ITEM', collection, payload: { id } });
        showToast(`${getCollectionLabel(collection)} deleted successfully!`, 'success');

        if (collection !== 'auditLogs') {
          await writeAuditLog({
            action: 'delete',
            entityType: getCollectionLabel(collection),
            entityId: id,
            oldValues: oldItem,
            newValues: null
          });
        }
      } catch (err) {
        console.error(`[SIRIAN DB] Failed to delete from ${collection}:`, err);
        showToast(`Failed to delete ${getCollectionLabel(collection).toLowerCase()}.`, 'error');
      }
    }
  }, [showToast, writeAuditLog, state]);

  const lookup = useCallback((collection, id) => state[collection]?.find(i => i.id === id), [state]);

  // ── Maintenance Approval Sequence Helpers ───────────────────────────────
  const submitRepairRequest = useCallback(async (repairData) => {
    const id = 'm_' + Math.random().toString(36).substr(2, 9);
    const item = {
      ...repairData,
      id,
      driver_id: repairData.driver_id || state.user?.id || null,
      type: repairData.type || 'repair',
      status: 'pending_ops',
      expected_cost: Number(repairData.expected_cost) || 0,
      evidence_photos: repairData.evidence_photos || [],
      evidence_audio: repairData.evidence_audio || null,
      created_at: new Date().toISOString()
    };
    await addItem('maintenance', item);
    return id;
  }, [addItem, state.user]);

  const approveMaintenanceByOps = useCallback(async (id, opsData) => {
    const existing = state.maintenance?.find(m => m.id === id);
    if (!existing) return;
    const changes = {
      ...existing,
      ...opsData,
      status: 'pending_admin',
      ops_approved_by: state.user?.id || null,
      ops_approved_at: new Date().toISOString(),
      expected_cost: Number(opsData.expected_cost ?? existing.expected_cost) || 0,
    };
    await updateItem('maintenance', changes);
    showToast('Maintenance request reviewed & submitted to Admin for final approval', 'success');
  }, [updateItem, state.maintenance, state.user, showToast]);

  const approveMaintenanceByAdmin = useCallback(async (id, adminData = {}) => {
    const existing = state.maintenance?.find(m => m.id === id);
    if (!existing) return;
    const changes = {
      ...existing,
      ...adminData,
      status: 'approved_scheduled',
      admin_approved_by: state.user?.id || null,
      admin_approved_at: new Date().toISOString(),
      is_non_working_day: adminData.is_non_working_day ?? existing.is_non_working_day ?? true,
      scheduled_date: adminData.scheduled_date || existing.scheduled_date,
    };
    await updateItem('maintenance', changes);
    showToast(`Maintenance approved & locked for ${changes.scheduled_date || 'scheduled date'}!`, 'success');
  }, [updateItem, state.maintenance, state.user, showToast]);

  const rejectMaintenance = useCallback(async (id, rejectionReason) => {
    const existing = state.maintenance?.find(m => m.id === id);
    if (!existing) return;
    const changes = {
      ...existing,
      status: 'rejected',
      rejection_reason: rejectionReason,
    };
    await updateItem('maintenance', changes);
    showToast('Maintenance request was rejected', 'warning');
  }, [updateItem, state.maintenance, showToast]);

  const startMaintenance = useCallback(async (id) => {
    const existing = state.maintenance?.find(m => m.id === id);
    if (!existing) return;
    await updateItem('maintenance', { ...existing, status: 'in_progress' });
    if (existing.vehicle_id) {
      const vehicle = state.vehicles?.find(v => v.id === existing.vehicle_id);
      if (vehicle && vehicle.status !== 'maintenance') {
        await updateItem('vehicles', { ...vehicle, status: 'maintenance' });
      }
    }
    showToast('Vehicle marked as In Maintenance', 'info');
  }, [updateItem, state.maintenance, state.vehicles, showToast]);

  const completeMaintenance = useCallback(async (id, completionData) => {
    const existing = state.maintenance?.find(m => m.id === id);
    if (!existing) return;
    const finalCost = Number(completionData.cost ?? existing.cost ?? existing.expected_cost) || 0;
    const partsCost = Number(completionData.parts_cost) || 0;
    const laborCost = Number(completionData.labor_cost) || (finalCost - partsCost);
    const serviceDate = completionData.service_date || new Date().toISOString().split('T')[0];

    const changes = {
      ...existing,
      ...completionData,
      status: 'completed',
      cost: finalCost,
      parts_cost: partsCost,
      labor_cost: laborCost,
      service_date: serviceDate,
    };
    await updateItem('maintenance', changes);

    // Update vehicle status back to active & update odometer if needed
    if (existing.vehicle_id) {
      const vehicle = state.vehicles?.find(v => v.id === existing.vehicle_id);
      if (vehicle) {
        const newOdo = completionData.odometer_at_service && Number(completionData.odometer_at_service) > vehicle.current_odometer
          ? Number(completionData.odometer_at_service)
          : vehicle.current_odometer;
        await updateItem('vehicles', { ...vehicle, status: 'active', current_odometer: newOdo });
      }
    }

    // Auto-sync expense into Expenses module (category ec2 = Repairs & Maintenance)
    try {
      const expenseId = 'exp_maint_' + Math.random().toString(36).substr(2, 7);
      await addItem('expenses', {
        id: expenseId,
        trip_id: null,
        vehicle_id: existing.vehicle_id,
        driver_id: existing.driver_id || null,
        category_id: 'ec2', // Repairs & Maintenance
        amount: finalCost,
        is_redeemable: false,
        is_redeemed: false,
        expense_date: serviceDate,
        submitted_by: state.user?.id || null,
        notes: `Maintenance: ${existing.service_type || 'Service'} (${existing.vendor || 'Workshop'})`,
        approval_status: 'approved',
        approved_by: state.user?.id || null,
        created_at: new Date().toISOString()
      });
    } catch (expErr) {
      console.warn('[SIRIAN] Auto-expense creation for maintenance notice:', expErr.message);
    }

    showToast('Maintenance service marked as completed & expenses recorded', 'success');
  }, [updateItem, addItem, state.maintenance, state.vehicles, state.user, showToast]);

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
    <AppContext.Provider value={{
      ...state,
      login, logout, toggleSidebar,
      addItem, updateItem, deleteItem, lookup, showToast, dispatch,
      submitRepairRequest, approveMaintenanceByOps, approveMaintenanceByAdmin,
      rejectMaintenance, startMaintenance, completeMaintenance,
    }}>
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
