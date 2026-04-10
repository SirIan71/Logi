import { createContext, useContext, useReducer, useCallback } from 'react';
import { users, clients, vehicles, routes, trips, income, expenses, expenseCategories, fuelRecords, maintenance, vehicleDocuments, auditLogs } from '../data/seedData.js';

const AppContext = createContext();

const initialState = {
  user: null,
  users, clients, vehicles, routes, trips, income, expenses, expenseCategories, fuelRecords, maintenance, vehicleDocuments, auditLogs,
  sidebarOpen: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': return { ...state, user: action.payload };
    case 'LOGOUT': return { ...state, user: null };
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'ADD_ITEM': return { ...state, [action.collection]: [...state[action.collection], action.payload] };
    case 'UPDATE_ITEM': return { ...state, [action.collection]: state[action.collection].map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'DELETE_ITEM': return { ...state, [action.collection]: state[action.collection].filter(i => i.id !== action.payload.id) };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback((email, password) => {
    const u = state.users.find(u => u.email === email && u.password === password);
    if (u) { dispatch({ type: 'LOGIN', payload: u }); return true; }
    return false;
  }, [state.users]);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);

  const addItem = useCallback((collection, item) => dispatch({ type: 'ADD_ITEM', collection, payload: item }), []);
  const updateItem = useCallback((collection, item) => dispatch({ type: 'UPDATE_ITEM', collection, payload: item }), []);
  const deleteItem = useCallback((collection, id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      dispatch({ type: 'DELETE_ITEM', collection, payload: { id } });
    }
  }, []);

  const lookup = useCallback((collection, id) => state[collection]?.find(i => i.id === id), [state]);

  return (
    <AppContext.Provider value={{ ...state, login, logout, toggleSidebar, addItem, updateItem, deleteItem, lookup, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
