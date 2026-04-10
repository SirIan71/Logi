import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
