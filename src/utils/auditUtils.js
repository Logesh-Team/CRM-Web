const ACTION_COLORS = {
  USER_CREATED:       { bg: '#EAF3DE', text: '#3B6D11' },
  USER_DELETED:       { bg: '#FCEBEB', text: '#A32D2D' },
  USER_UPDATED:       { bg: '#E6F1FB', text: '#185FA5' },
  ROLE_CHANGED:       { bg: '#EEEDFE', text: '#534AB7' },
  PASSWORD_CHANGED:   { bg: '#FAEEDA', text: '#BA7517' },
  STATUS_CHANGED:     { bg: '#E6F1FB', text: '#185FA5' },
  USER_ACTIVATED:     { bg: '#EAF3DE', text: '#3B6D11' },
  USER_DEACTIVATED:   { bg: '#FCEBEB', text: '#A32D2D' },
  LOGIN:              { bg: '#F0EEE9', text: '#5A5A56' },
};

const ACTION_LABELS = {
  USER_CREATED:     'User Created',
  USER_DELETED:     'User Deleted',
  USER_UPDATED:     'Profile Updated',
  ROLE_CHANGED:     'Role Changed',
  PASSWORD_CHANGED: 'Password Changed',
  STATUS_CHANGED:   'Status Changed',
  USER_ACTIVATED:   'User Activated',
  USER_DEACTIVATED: 'User Deactivated',
  LOGIN:            'Login',
};

export function getAuditActionColor(action) {
  return ACTION_COLORS[action] || { bg: '#F0EEE9', text: '#5A5A56' };
}

export function formatAuditAction(action) {
  return ACTION_LABELS[action] || action?.replace(/_/g, ' ') || '—';
}
