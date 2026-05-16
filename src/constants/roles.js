export const USER_ROLES = [
  { value: 'SUPER_ADMIN',         label: 'Super Admin',         color: '#534AB7', bg: '#EEEDFE' },
  { value: 'SALES_MANAGER',       label: 'Sales Manager',       color: '#0F6E56', bg: '#E1F5EE' },
  { value: 'SALES_EXECUTIVE',     label: 'Sales Executive',     color: '#185FA5', bg: '#E6F1FB' },
  { value: 'MARKETING_EXECUTIVE', label: 'Marketing Executive', color: '#BA7517', bg: '#FAEEDA' },
  { value: 'SYSTEM_BOT',          label: 'System Bot',          color: '#5A5A56', bg: '#F0EEE9' },
];

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE', 'USER_ROLE_CHANGE',
    'AUDIT_VIEW',
    'LEAD_READ_ALL', 'LEAD_ASSIGN', 'LEAD_UPDATE_ALL', 'LEAD_DELETE',
    'DASHBOARD_FULL', 'DASHBOARD_TEAM', 'DASHBOARD_OWN',
    'REPORT_FULL', 'REPORT_TEAM', 'REPORT_OWN',
    'API_KEY_MANAGE', 'SYSTEM_CONFIG',
    'QUOTATION_APPROVE', 'CAMPAIGN_ANALYTICS',
  ],
  SALES_MANAGER: [
    'USER_READ', 'LEAD_READ_ALL', 'LEAD_ASSIGN', 'LEAD_UPDATE_ALL',
    'ACTIVITY_READ_ALL', 'DEMO_SCHEDULE', 'QUOTATION_APPROVE',
    'QUOTATION_CREATE', 'DASHBOARD_TEAM', 'DASHBOARD_OWN',
    'REPORT_TEAM', 'REPORT_OWN', 'CAMPAIGN_ANALYTICS',
  ],
  SALES_EXECUTIVE: [
    'LEAD_CREATE', 'LEAD_READ_OWN', 'LEAD_UPDATE_OWN',
    'ACTIVITY_LOG', 'ACTIVITY_READ_OWN', 'DEMO_SCHEDULE',
    'QUOTATION_CREATE', 'DASHBOARD_OWN', 'REPORT_OWN',
  ],
  MARKETING_EXECUTIVE: [
    'CAMPAIGN_CREATE', 'CAMPAIGN_MANAGE', 'CAMPAIGN_ANALYTICS',
    'LEAD_READ_ALL', 'LEAD_CREATE', 'DASHBOARD_OWN',
  ],
  SYSTEM_BOT: ['LEAD_CREATE', 'LEAD_UPDATE_ALL', 'ACTIVITY_LOG'],
};

export const PERMISSION_CATEGORIES = {
  User:     (p) => p.startsWith('USER_'),
  Lead:     (p) => p.startsWith('LEAD_'),
  Activity: (p) => p.startsWith('ACTIVITY_') || p === 'DEMO_SCHEDULE',
  Reports:  (p) => p.startsWith('REPORT_') || p.startsWith('DASHBOARD_'),
  System:   (p) => p.startsWith('API_KEY_') || p.startsWith('SYSTEM_') || p.startsWith('CAMPAIGN_') || p.startsWith('QUOTATION_'),
};

export const getRoleConfig = (role) =>
  USER_ROLES.find((r) => r.value === role) || USER_ROLES[4];

export const hasPermission = (userRole, permission) =>
  ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;

export const getRole = (user) => {
  if (!user) return '';
  if (user.role) return user.role;
  if (user.realm_access?.roles) {
    return (
      user.realm_access.roles.find(
        (r) => !r.startsWith('default-roles') && !r.startsWith('uma_') && !r.startsWith('offline')
      ) || ''
    );
  }
  return '';
};
