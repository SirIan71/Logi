import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, searchFilter } from '../utils/helpers';
import { Search, Filter } from 'lucide-react';

export default function AuditLog() {
  const { auditLogs, lookup } = useApp();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const entityTypes = [...new Set(auditLogs.map(l => l.entity_type))];

  const filtered = useMemo(() => {
    let data = entityFilter === 'all' ? auditLogs : auditLogs.filter(l => l.entity_type === entityFilter);
    return searchFilter(data, search, ['entity_type', 'action']).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [auditLogs, search, entityFilter]);

  const actionColors = { create: 'var(--color-success)', update: 'var(--color-info)', delete: 'var(--color-danger)' };

  return (
    <div>
      <div className="page-header"><h1>Audit Log</h1></div>
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input"><Search size={15}/><input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}/></div>
            <select className="filter-select" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
              <option value="all">All Entities</option>
              {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <span style={{fontSize:12,color:'var(--text-muted)'}}>{filtered.length} log entries</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Changes</th></tr></thead>
            <tbody>
              {filtered.map(log => {
                const user = lookup('users', log.user_id);
                return (
                  <tr key={log.id}>
                    <td style={{whiteSpace:'nowrap'}}>{formatDateTime(log.created_at)}</td>
                    <td className="primary">{user?.name || 'System'}</td>
                    <td><span style={{color: actionColors[log.action], fontWeight:600, textTransform:'uppercase', fontSize:11, letterSpacing:0.5}}>{log.action}</span></td>
                    <td><span style={{background:'var(--bg-input)',padding:'3px 8px',borderRadius:4,fontSize:12,fontWeight:500}}>{log.entity_type}</span> <span style={{color:'var(--text-muted)',fontSize:11}}>{log.entity_id}</span></td>
                    <td style={{maxWidth:300}}>
                      {log.new_values && <span style={{fontSize:12,color:'var(--text-secondary)'}}>
                        {Object.entries(log.new_values).map(([k, v]) => <span key={k} style={{display:'inline-block',marginRight:8}}><span style={{color:'var(--text-muted)'}}>{k}:</span> <span style={{fontWeight:500}}>{String(v)}</span></span>)}
                      </span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} entries</span></div>
      </div>
    </div>
  );
}
