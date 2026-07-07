import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { usePermission } from '../hooks/usePermission';
import { Shield, Users, Database, Palette, Bell, Check, X, UserPlus } from 'lucide-react';
import db from '../lib/db.js';

export default function Settings() {
  const { user, users, updateItem } = useApp();
  const { role } = usePermission('settings');
  const isAdmin = role === 'admin';

  // Build sections list based on role
  const allSections = [
    { icon: Users, title: 'User Management', desc: 'Manage users, roles, and permissions', badge: 'Admin Only', adminOnly: true },
    { icon: Database, title: 'Data Management', desc: 'Backup, export, and import company data', badge: null, adminOnly: true },
    { icon: Palette, title: 'Appearance', desc: 'Theme, language, and display preferences', badge: null, adminOnly: false },
    { icon: Bell, title: 'Notifications', desc: 'Configure email and telegram notifications', badge: null, adminOnly: false },
    { icon: Shield, title: 'Security', desc: 'Password policies, 2FA, and session management', badge: null, adminOnly: true },
  ];

  const sections = isAdmin ? allSections : allSections.filter(s => !s.adminOnly);

  const [activeTab, setActiveTab] = useState(sections[0]?.title || 'Appearance');
  const [theme, setTheme] = useState('lighttheme');
  const [emailNotif, setEmailNotif] = useState(true);
  const [teleNotif, setTeleNotif] = useState(false);
  const [teleId, setTeleId] = useState('');
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);

  // ── Invite User state ──────────────────────────────────────────────────
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('driver');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ type: '', text: '' });

  const handleRoleChange = (userId, newRole) => {
    const u = users.find(x => x.id === userId);
    if(u) updateItem('users', { ...u, role: newRole });
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg({ type: '', text: '' });

    try {
      // Create auth user via signUp — this triggers the DB trigger to create the profile
      const { data, error } = await db.auth.signUp({
        email: inviteEmail,
        password: invitePassword,
        options: {
          data: {
            name: inviteName,
            phone: invitePhone,
            role: inviteRole,
          },
        },
      });

      if (error) {
        setInviteMsg({ type: 'error', text: error.message });
        return;
      }

      if (data?.user) {
        setInviteMsg({
          type: 'success',
          text: `User ${inviteEmail} created successfully! They can now log in with the password you set.`,
        });
        // Clear the form
        setInviteName('');
        setInviteEmail('');
        setInvitePhone('');
        setInviteRole('driver');
        setInvitePassword('');

        // Reload users list after a brief delay (trigger needs a moment)
        setTimeout(async () => {
          const { data: allUsers } = await db.from('users').select('*');
          if (allUsers) {
            // Dispatch through context isn't directly available, so we'll just note it
            // The user list will refresh on next page navigation
          }
        }, 2000);
      }
    } catch (err) {
      setInviteMsg({ type: 'error', text: err.message });
    } finally {
      setInviteLoading(false);
    }
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

          {activeTab === 'Security' && isAdmin && (
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

          {activeTab === 'User Management' && isAdmin && (
            <div>
              {/* ── Invite User Form ────────────────────────────────────── */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
              }}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                  <UserPlus size={18} style={{color:'var(--color-accent)'}} />
                  <h3 style={{margin:0,fontSize:15,fontWeight:700}}>Invite New User</h3>
                </div>

                {inviteMsg.text && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 14,
                    fontSize: 13,
                    background: inviteMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: inviteMsg.type === 'error' ? '#dc2626' : '#16a34a',
                    border: `1px solid ${inviteMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                  }}>
                    {inviteMsg.text}
                  </div>
                )}

                <form onSubmit={handleInviteUser}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. John Moyo" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="john@company.com" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" type="tel" value={invitePhone} onChange={e => setInvitePhone(e.target.value)} placeholder="+27 71 234 5678" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                        <option value="admin">Admin</option>
                        <option value="finance">Finance</option>
                        <option value="operations">Operations</option>
                        <option value="driver">Driver</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temporary Password</label>
                      <input className="form-input" type="text" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required />
                    </div>
                    <div className="form-group" style={{display:'flex',alignItems:'flex-end'}}>
                      <button type="submit" className="btn btn-primary" disabled={inviteLoading} style={{width:'100%'}}>
                        {inviteLoading ? 'Creating…' : 'Create User'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* ── Existing Users Table ─────────────────────────────────── */}
              <table className="data-table" style={{width:'100%'}}>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="primary">{u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || u.email)}</td>
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

          {activeTab === 'Data Management' && isAdmin && (
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
