import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { daysUntil } from '../../utils/helpers';

export default function Topbar() {
  const location = useLocation();
  const titleMap = {
    '/': 'Dashboard', '/trips': 'Trips', '/routes': 'Routes', '/fleet': 'Fleet',
    '/clients': 'Clients', '/income': 'Income', '/fuel': 'Fuel',
    '/expenses': 'Expenses', '/reports': 'Reports', '/audit-log': 'Audit Log', '/settings': 'Settings'
  };
  const title = titleMap[location.pathname] || 'Dashboard';
  const { user, vehicleDocuments, maintenance, lookup } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = useMemo(() => {
    const alerts = [];
    vehicleDocuments?.forEach(doc => {
      const d = daysUntil(doc.expiry_date);
      if (d >= 0 && d <= 14) alerts.push({ id: doc.id, type: 'Document Expiry', message: `${lookup('vehicles', doc.vehicle_id)?.registration} ${doc.doc_type} expires in ${d} days.` });
    });
    maintenance?.forEach(m => {
      const d = daysUntil(m.next_due_date);
      if (d >= 0 && d <= 14) alerts.push({ id: m.id, type: 'Maintenance Due', message: `${lookup('vehicles', m.vehicle_id)?.registration} ${m.service_type} due in ${d} days.` });
    });
    return alerts;
  }, [vehicleDocuments, maintenance, lookup]);

  return (
    <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex justify-between items-center px-8 h-16">
      <div className="flex items-center gap-8">
      </div>
      <div className="flex items-center gap-4 relative">
        <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest flex-shrink-0 transition-colors active:scale-95 duration-150 relative">
          <span className="material-symbols-outlined text-primary">notifications</span>
          {notifications.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full outline outline-2 outline-surface"></span>}
        </button>
        {showNotifications && (
          <div className="absolute top-12 right-12 w-80 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-50 flex flex-col">
            <div className="bg-primary px-4 py-3 text-white font-bold text-sm">Notifications</div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? <div className="p-4 text-center text-sm text-outline-variant">No pending alerts.</div> : notifications.map(n => (
                <div key={n.id} className="p-3 border-b border-outline-variant/10 hover:bg-surface-container-lowest text-sm">
                  <div className="font-bold text-error text-xs mb-1 uppercase tracking-wider">{n.type}</div>
                  <div className="text-primary font-medium">{n.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined text-primary">settings</span>
        </button>
        <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-primary/60 font-medium uppercase tracking-wider">{user?.role || 'Super Administrator'}</p>
          </div>
          {user?.avatar ? (
            <img alt="User profile" className="w-10 h-10 rounded-xl object-cover" src={user.avatar} />
          ) : (
             <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold">
               {user?.name?.charAt(0) || 'A'}
             </div>
          )}
        </div>
      </div>
    </header>
  );
}
