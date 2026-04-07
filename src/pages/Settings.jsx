import { useApp } from '../context/AppContext';
import { Shield, Users, Database, Palette, Bell } from 'lucide-react';

export default function Settings() {
  const { user } = useApp();

  const sections = [
    { icon: Users, title: 'User Management', desc: 'Manage users, roles, and permissions', badge: 'Admin Only' },
    { icon: Database, title: 'Data Management', desc: 'Backup, export, and import company data', badge: null },
    { icon: Palette, title: 'Appearance', desc: 'Theme, language, and display preferences', badge: null },
    { icon: Bell, title: 'Notifications', desc: 'Configure email and in-app notifications', badge: null },
    { icon: Shield, title: 'Security', desc: 'Password policies, 2FA, and session management', badge: null },
  ];

  return (
    <div>
      <div className="page-header"><h1>Settings</h1></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
        {sections.map((s, i) => (
          <div key={i} className="kpi-card" style={{cursor:'pointer','--kpi-color':'var(--color-accent)','--kpi-bg':'var(--color-accent-glow)'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
              <div className="kpi-icon"><s.icon size={20}/></div>
              <div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
                  {s.title}
                  {s.badge && <span style={{fontSize:10,fontWeight:600,background:'var(--color-accent-glow)',color:'var(--color-accent)',padding:'2px 8px',borderRadius:12}}>{s.badge}</span>}
                </div>
                <div style={{fontSize:13,color:'var(--text-muted)'}}>{s.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="chart-card" style={{marginTop:24}}>
        <div className="chart-card-header"><span className="chart-card-title">System Information</span></div>
        <div className="detail-grid" style={{paddingTop:8}}>
          <div><div className="detail-label">Application</div><div className="detail-value">SIRIAN v1.0.0</div></div>
          <div><div className="detail-label">Environment</div><div className="detail-value">Demo / Development</div></div>
          <div><div className="detail-label">Logged In As</div><div className="detail-value">{user?.name} ({user?.role})</div></div>
          <div><div className="detail-label">Data Storage</div><div className="detail-value">Client-side (Mock Data)</div></div>
        </div>
      </div>
    </div>
  );
}
