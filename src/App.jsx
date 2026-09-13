import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { canAccess } from './config/rbac';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import SessionTimeout from './components/common/SessionTimeout';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

// Lazy-load route pages for bundle splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trips = lazy(() => import('./pages/Trips'));
const RoutesPage = lazy(() => import('./pages/Routes'));
const Fleet = lazy(() => import('./pages/Fleet'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Clients = lazy(() => import('./pages/Clients'));
const Income = lazy(() => import('./pages/Income'));
const Fuel = lazy(() => import('./pages/Fuel'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Reports = lazy(() => import('./pages/Reports'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            {/* Dashboard is always accessible (driver gets personal view) */}
            <Route path="/" element={<Dashboard />} />

            <Route path="/trips" element={<ProtectedRoute page="trips"><Trips /></ProtectedRoute>} />
            <Route path="/routes" element={<ProtectedRoute page="routes"><RoutesPage /></ProtectedRoute>} />
            <Route path="/fleet" element={<ProtectedRoute page="fleet"><Fleet /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute page="maintenance"><Maintenance /></ProtectedRoute>} />
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
      </Suspense>
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
