import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getGroupedNavItems } from '../../config/rbac';

export default function Sidebar() {
  const { logout, user } = useApp();
  const navGroups = getGroupedNavItems(user?.role || 'driver');

  // Separate main groups from footer items
  const mainGroups = navGroups.filter(g => g.group !== 'footer');
  const footerItems = navGroups.find(g => g.group === 'footer')?.items || [];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
      isActive
        ? 'bg-lime-400 text-teal-950 font-bold scale-98'
        : 'text-teal-800 hover:bg-slate-200/50'
    }`;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-teal-950 flex flex-col p-6 space-y-4 z-40 border-r border-outline-variant/20">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary-fixed">local_shipping</span>
        </div>
        <div>
          <h2 className="font-headline font-extrabold text-teal-900 dark:text-teal-50 leading-tight">Nory Logistics Ltd</h2>
          <p className="text-[10px] uppercase tracking-widest text-teal-700/60 font-bold">Serving The Earth</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {mainGroups.map(({ group, items }) => (
          <div key={group} className="mb-4">
            <p className="px-3 text-[10px] font-bold text-outline uppercase tracking-wider mb-2">{group}</p>
            {items.map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === '/'} className={linkClass}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-headline text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      
      <div className="pt-4 mt-auto space-y-1">
        {footerItems.map(item => (
          <NavLink key={item.path} to={item.path} className="flex items-center gap-3 px-3 py-2 text-teal-800 hover:bg-slate-200/50 rounded-xl transition-all">
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-headline text-sm">{item.label}</span>
          </NavLink>
        ))}
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-teal-800 hover:bg-slate-200/50 rounded-xl transition-all">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-headline text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
