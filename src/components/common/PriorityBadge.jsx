import React from 'react';
import { getPriorityColor } from '../../utils/leadStatusColor';

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  const colors = getPriorityColor(priority);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: colors.bg,
        color: colors.text,
        borderRadius: 999,
        padding: '2px 7px',
        fontSize: 10,
        fontWeight: 600,
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
      }}
    >
      {priority}
    </span>
  );
}
