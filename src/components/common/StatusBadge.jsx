import React from 'react';
import { getStatusColor, STATUS_LABELS } from '../../utils/leadStatusColor';

export default function StatusBadge({ status }) {
  const colors = getStatusColor(status);
  const label = STATUS_LABELS[status] || status || '—';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 500,
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
      }}
    >
      {label}
    </span>
  );
}
