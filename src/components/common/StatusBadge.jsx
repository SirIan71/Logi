import { getStatusColor, getStatusLabel } from '../../utils/helpers';

export default function StatusBadge({ status }) {
  const color = getStatusColor(status);
  const bgMap = {
    'var(--color-success)': 'var(--color-success-bg)',
    'var(--color-warning)': 'var(--color-warning-bg)',
    'var(--color-danger)': 'var(--color-danger-bg)',
    'var(--color-info)': 'var(--color-info-bg)',
    'var(--color-muted)': '#64748b18',
  };
  return (
    <span className="status-badge" style={{ '--badge-color': color, '--badge-bg': bgMap[color] || '#64748b18' }}>
      {getStatusLabel(status)}
    </span>
  );
}
