import { useApp } from '../../context/AppContext';
import { Menu, Search, Bell } from 'lucide-react';

export default function Topbar({ title, onMenuClick }) {
  const { sidebarOpen, toggleSidebar, maintenance, income } = useApp();

  const now = new Date();
  const overdueServices = maintenance?.filter(m => m.next_due_date && new Date(m.next_due_date) < now).length || 0;
  const unpaidInvoices = income?.filter(i => i.payment_status === 'unpaid').length || 0;
  const hasAlerts = overdueServices > 0 || unpaidInvoices > 0;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={() => { toggleSidebar(); onMenuClick?.(); }}>
          <Menu size={20}/>
        </button>
        <h2 className="topbar-title">{title}</h2>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={16}/>
          <input type="text" placeholder="Search anything..." />
        </div>
        <button className="topbar-btn" title="Notifications">
          <Bell size={20}/>
          {hasAlerts && <span className="badge"/>}
        </button>
      </div>
    </header>
  );
}
