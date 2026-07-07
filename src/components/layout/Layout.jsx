import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../../context/AppContext';

const PAGE_NAMES = {
  '/': 'Dashboard',
  '/trips': 'Trips',
  '/routes': 'Routes',
  '/fleet': 'Fleet',
  '/drivers': 'Drivers',
  '/clients': 'Clients',
  '/income': 'Income',
  '/fuel': 'Fuel',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/audit-log': 'Audit Log',
  '/settings': 'Settings'
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { writeAuditLog, user } = useApp();

  useEffect(() => {
    if (user && writeAuditLog) {
      const pageName = PAGE_NAMES[location.pathname] || 'Page';
      writeAuditLog({
        action: 'view',
        entityType: 'Page',
        entityId: location.pathname,
        oldValues: null,
        newValues: { page: pageName }
      });
    }
  }, [location.pathname, user, writeAuditLog]);

  return (
    <>
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <main className="ml-64 min-h-screen">
        <Topbar />
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          <Outlet />
        </div>
      </main>
      
      {/* FAB for quick action - only visible on dashboard as central action */}
      {location.pathname === '/' && (
        <button className="fixed bottom-8 right-8 w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
        </button>
      )}
    </>
  );
}
