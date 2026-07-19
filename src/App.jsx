import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { canAccess } from './config/rbac';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import RoutesPage from './pages/Routes';
import Fleet from './pages/Fleet';
import Clients from './pages/Clients';
import Income from './pages/Income';
import Fuel from './pages/Fuel';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Drivers from './pages/Drivers';
import SessionTimeout from './components/common/SessionTimeout';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

/**
 * Route guard — redirects to dashboard if the user's role
 * does not have access to the given page.
 */
function ProtectedRoute({ page, children }) {
  const { user } = useApp();
  if (!canAccess(user?.role, page)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useApp();

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <SessionTimeout />
      <Routes>
        <Route element={<Layout />}>
          {/* Dashboard is always accessible (driver gets personal view) */}
          <Route path="/" element={<Dashboard />} />

          <Route path="/trips" element={<ProtectedRoute page="trips"><Trips /></ProtectedRoute>} />
          <Route path="/routes" element={<ProtectedRoute page="routes"><RoutesPage /></ProtectedRoute>} />
          <Route path="/fleet" element={<ProtectedRoute page="fleet"><Fleet /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute page="drivers"><Drivers /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute page="clients"><Clients /></ProtectedRoute>} />
          <Route path="/income" element={<ProtectedRoute page="income"><Income /></ProtectedRoute>} />
          <Route path="/fuel" element={<ProtectedRoute page="fuel"><Fuel /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute page="expenses"><Expenses /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute page="reports"><Reports /></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute page="audit-log"><AuditLog /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute page="settings"><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <SpeedInsights />
      <Analytics />
    </AppProvider>
  );
}
