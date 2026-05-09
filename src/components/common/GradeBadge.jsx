import React from 'react';
import { getGradeColor } from '../../utils/leadStatusColor';

export default function GradeBadge({ grade }) {
  if (!grade) return null;
  const colors = getGradeColor(grade);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: 4,
        background: colors.bg,
        color: colors.text,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'DM Mono, monospace',
        flexShrink: 0,
      }}
    >
      {grade}
    </span>
  );
}
