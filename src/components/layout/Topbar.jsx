import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function Topbar() {
  const location = useLocation();
  const titleMap = {
    '/': 'Dashboard', '/trips': 'Trips', '/routes': 'Routes', '/fleet': 'Fleet',
    '/clients': 'Clients', '/income': 'Income', '/fuel': 'Fuel',
    '/expenses': 'Expenses', '/reports': 'Reports', '/audit-log': 'Audit Log', '/settings': 'Settings'
  };
  const title = titleMap[location.pathname] || 'Dashboard';
  const { user } = useApp();

  return (
    <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex justify-between items-center px-8 h-16">
      <div className="flex items-center gap-8">
        <h1 className="font-headline text-xl font-bold tracking-tight text-primary">{title}</h1>
        <div className="hidden md:flex bg-surface-container-high px-4 py-2 rounded-full items-center gap-2 w-80 border border-outline-variant/20 focus-within:border-primary/50 transition-colors">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input className="bg-transparent text-primary border-none focus:ring-0 text-sm w-full font-body outline-none" placeholder="Search shipments, routes, or fleet..." type="text" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined text-primary">notifications</span>
        </button>
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
