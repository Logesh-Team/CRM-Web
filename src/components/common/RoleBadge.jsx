import React from 'react';
import { getRoleConfig } from '../../constants/roles';

export default function RoleBadge({ role, size = 'sm' }) {
  if (!role) return null;
  const config = getRoleConfig(role);
  const fontSize = size === 'xs' ? 9 : 10;
  const padding = size === 'xs' ? '1px 7px' : '2px 10px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: config.bg,
        color: config.color,
        borderRadius: 20,
        padding,
        fontSize,
        fontWeight: 500,
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
      }}
    >
      {config.label}
    </span>
  );
}
