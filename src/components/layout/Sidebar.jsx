import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const { logout } = useApp();
  
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-teal-950 flex flex-col p-6 space-y-4 z-40 border-r border-outline-variant/20">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary-fixed">local_shipping</span>
        </div>
        <div>
          <h2 className="font-headline font-extrabold text-teal-900 dark:text-teal-50 leading-tight">Kinetic Cargo</h2>
          <p className="text-[10px] uppercase tracking-widest text-teal-700/60 font-bold">Logistics OS</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        <div className="mb-4">
          <p className="px-3 text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Overview</p>
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-headline text-sm">Dashboard</span>
          </NavLink>
        </div>
        
        <div className="mb-4">
          <p className="px-3 text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Operations</p>
          <NavLink to="/trips" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">route</span>
            <span className="font-headline text-sm">Trips</span>
          </NavLink>
          <NavLink to="/routes" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">map</span>
            <span className="font-headline text-sm">Routes</span>
          </NavLink>
          <NavLink to="/fleet" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">local_shipping</span>
            <span className="font-headline text-sm">Fleet</span>
          </NavLink>
          <NavLink to="/drivers" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">badge</span>
            <span className="font-headline text-sm">Drivers</span>
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">group</span>
            <span className="font-headline text-sm">Clients</span>
          </NavLink>
        </div>
        
        <div className="mb-4">
          <p className="px-3 text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Finance</p>
          <NavLink to="/income" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">payments</span>
            <span className="font-headline text-sm">Income</span>
          </NavLink>
          <NavLink to="/fuel" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">gas_meter</span>
            <span className="font-headline text-sm">Fuel</span>
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-lime-400 text-teal-950 font-bold scale-98' : 'text-teal-800 hover:bg-slate-200/50'}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="font-headline text-sm">Expenses</span>
          </NavLink>
        </div>
      </nav>
      
      <div className="pt-4 mt-auto space-y-1">
        <NavLink to="/reports" className="flex items-center gap-3 px-3 py-2 text-teal-800 hover:bg-slate-200/50 rounded-xl transition-all">
          <span className="material-symbols-outlined">help</span>
          <span className="font-headline text-sm">Reports</span>
        </NavLink>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-teal-800 hover:bg-slate-200/50 rounded-xl transition-all">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-headline text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
