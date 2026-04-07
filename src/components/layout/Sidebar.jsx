import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Truck, MapPin, Package, Users, DollarSign,
  Fuel, Receipt, FileText, Settings, ScrollText, Menu, LogOut, X
} from 'lucide-react';

const navItems = [
  { label: 'Overview', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { label: 'Operations', items: [
    { to: '/trips', icon: Package, label: 'Trips' },
    { to: '/routes', icon: MapPin, label: 'Routes' },
    { to: '/fleet', icon: Truck, label: 'Fleet' },
    { to: '/clients', icon: Users, label: 'Clients' },
  ]},
  { label: 'Finance', items: [
    { to: '/income', icon: DollarSign, label: 'Income' },
    { to: '/fuel', icon: Fuel, label: 'Fuel' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
  ]},
  { label: 'System', items: [
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

const roleAccess = {
  admin: null, // all
  finance: ['/','/income','/expenses','/fuel','/clients','/reports','/audit-log'],
  operations: ['/','/trips','/routes','/fleet','/clients','/fuel','/expenses','/reports'],
  driver: ['/','/trips','/fuel','/expenses'],
};

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, sidebarOpen, toggleSidebar, logout } = useApp();
  const location = useLocation();
  const allowed = roleAccess[user?.role];

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} style={{
        position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99
      }}/>}
      <aside className={`sidebar${sidebarOpen ? '' : ' collapsed'}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo">S</div>
          <span className="brand-text">SIRIAN</span>
          <button className="btn-icon" onClick={onCloseMobile} style={{marginLeft:'auto',display: mobileOpen ? 'flex' : 'none'}}>
            <X size={18}/>
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(section => {
            const visibleItems = section.items.filter(i => !allowed || allowed.includes(i.to));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item${isActive && location.pathname === item.to ? ' active' : ''}`}
                    onClick={onCloseMobile}
                    end={item.to === '/'}
                  >
                    <item.icon size={20}/>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="btn-icon" onClick={logout} style={{marginLeft:'auto'}} title="Logout">
            <LogOut size={18}/>
          </button>
        </div>
      </aside>
    </>
  );
}
