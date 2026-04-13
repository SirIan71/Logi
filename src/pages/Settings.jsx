import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Users, Database, Palette, Bell, Check, X } from 'lucide-react';
import { generateId } from '../utils/helpers';

export default function Settings() {
  const { user, users, updateItem } = useApp();
  const [activeTab, setActiveTab] = useState('User Management');
  const [theme, setTheme] = useState('lighttheme');
  const [emailNotif, setEmailNotif] = useState(true);
  const [teleNotif, setTeleNotif] = useState(false);
  const [teleId, setTeleId] = useState('');
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);

  const sections = [
    { icon: Users, title: 'User Management', desc: 'Manage users, roles, and permissions', badge: 'Admin Only' },
    { icon: Database, title: 'Data Management', desc: 'Backup, export, and import company data', badge: null },
    { icon: Palette, title: 'Appearance', desc: 'Theme, language, and display preferences', badge: null },
    { icon: Bell, title: 'Notifications', desc: 'Configure email and telegram notifications', badge: null },
    { icon: Shield, title: 'Security', desc: 'Password policies, 2FA, and session management', badge: null },
  ];

  const handleRoleChange = (userId, newRole) => {
    const u = users.find(x => x.id === userId);
    if(u) updateItem('users', { ...u, role: newRole });
  };

  const applyTheme = (t) => {
    setTheme(t);
    if(t === 'nature') {
      document.documentElement.style.setProperty('--color-accent', '#2b4d24');
      document.documentElement.style.setProperty('--color-accent-hover', '#1e3818');
      document.documentElement.style.setProperty('--color-accent-glow', '#dff2d8');
      document.documentElement.style.setProperty('--bg-sidebar', '#ebf2e8');
    } else {
      document.documentElement.style.setProperty('--color-accent', '#003539');
      document.documentElement.style.setProperty('--color-accent-hover', '#004f52');
      document.documentElement.style.setProperty('--color-accent-glow', '#b3ecf3');
      document.documentElement.style.setProperty('--bg-sidebar', '#f1f4f3');
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Settings</h1></div>
      <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
        <div style={{width: 320, display:'flex', flexDirection:'column', gap:8}}>
          {sections.map((s, i) => (
            <div key={i} onClick={() => setActiveTab(s.title)} className={`kpi-card ${activeTab === s.title ? 'active' : ''}`} style={{cursor:'pointer', padding:16, ...(activeTab===s.title ? {borderColor:'var(--color-accent)', boxShadow:'var(--shadow-md)'} : {})}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div className="kpi-icon" style={{width:32,height:32}}><s.icon size={16}/></div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:8}}>
                    {s.title}
                    {s.badge && <span style={{fontSize:9,fontWeight:700,background:'var(--color-accent-glow)',color:'var(--color-accent)',padding:'2px 6px',borderRadius:12}}>{s.badge}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="chart-card" style={{flex:1, minHeight: 400}}>
          <div className="chart-card-header" style={{borderBottom:'1px solid var(--border-color)', paddingBottom:16, marginBottom:20}}>
            <span className="chart-card-title">{activeTab}</span>
          </div>

          {activeTab === 'Appearance' && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label mb-2">Application Theme</label>
                <div style={{display:'flex',gap:12}}>
                  <button onClick={() => applyTheme('lighttheme')} className="btn" style={{border: `2px solid ${theme==='lighttheme'?'var(--color-accent)':'var(--border-color)'}`}}>Standard Light</button>
                  <button onClick={() => applyTheme('nature')} className="btn" style={{border: `2px solid ${theme==='nature'?'#2b4d24':'var(--border-color)'}`}}>Nature (Forest Green)</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="form-grid" style={{maxWidth: 500}}>
              <div className="form-group full" style={{display:'flex', alignItems:'center', gap:10}}>
                <input type="checkbox" className="form-checkbox" checked={emailNotif} onChange={e=>setEmailNotif(e.target.checked)}/>
                <label className="form-label" style={{margin:0}}>Enable Email Notifications</label>
              </div>
              <div className="form-group full" style={{display:'flex', alignItems:'center', gap:10, marginTop:10}}>
                <input type="checkbox" className="form-checkbox" checked={teleNotif} onChange={e=>setTeleNotif(e.target.checked)}/>
                <label className="form-label" style={{margin:0}}>Enable Telegram Notifications</label>
              </div>
              {teleNotif && (
                <div className="form-group full" style={{marginTop:10}}>
                  <label className="form-label">Telegram Chat ID / Username</label>
                  <input className="form-input" placeholder="@username or ID" value={teleId} onChange={e=>setTeleId(e.target.value)}/>
                </div>
              )}
              <div className="form-group full" style={{marginTop:20}}>
                <button className="btn btn-primary" onClick={() => alert('Notification settings saved!')}>Save Settings</button>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="form-grid" style={{maxWidth: 500}}>
              <div className="form-group full">
                <label className="form-label">Minimum Password Length</label>
                <input type="number" className="form-input" value={passwordMinLength} onChange={e=>setPasswordMinLength(+e.target.value)}/>
              </div>
              <div className="form-group full" style={{display:'flex', alignItems:'center', gap:10, marginTop:10}}>
                <input type="checkbox" className="form-checkbox" checked={requireSpecialChar} onChange={e=>setRequireSpecialChar(e.target.checked)}/>
                <label className="form-label" style={{margin:0}}>Require Special Characters (!@#$%)</label>
              </div>
              <div className="form-group full" style={{marginTop:20}}>
                <button className="btn btn-primary" onClick={() => alert('Security settings saved!')}>Update Security</button>
              </div>
            </div>
          )}

          {activeTab === 'User Management' && (
            <div>
              <table className="data-table" style={{width:'100%'}}>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="primary">{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <select className="form-select" style={{padding:'4px 8px', fontSize:12}} value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} disabled={u.role==='admin' && u.id===user.id}>
                          <option value="admin">Admin</option>
                          <option value="finance">Finance</option>
                          <option value="operations">Operations</option>
                          <option value="driver">Driver</option>
                        </select>
                      </td>
                      <td>{u.is_active ? <span style={{color:'var(--color-success)', fontWeight:600}}>Active</span> : 'Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Data Management' && (
             <div className="form-grid" style={{maxWidth: 500}}>
               <p className="text-secondary mb-4" style={{gridColumn:'1/-1'}}>Export or backup your entire operational logic and datasets.</p>
               <button className="btn btn-secondary">Backup System Data</button>
               <button className="btn btn-danger">Purge Old Logs</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
