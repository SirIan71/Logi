import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../../context/AppContext';

const pageTitles = {
  '/': 'Dashboard', '/trips': 'Trips', '/routes': 'Routes', '/fleet': 'Fleet Management',
  '/clients': 'Clients', '/income': 'Income', '/fuel': 'Fuel Tracking', '/expenses': 'Expenses',
  '/reports': 'Reports', '/audit-log': 'Audit Log', '/settings': 'Settings',
};

export default function Layout() {
  const { sidebarOpen } = useApp();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = pageTitles[location.pathname] || 'SIRIAN';

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <main className={`main-content${sidebarOpen ? '' : ' collapsed'}`}>
        <Topbar title={title} onMenuClick={() => setMobileOpen(prev => !prev)} />
        <div className="page-content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
