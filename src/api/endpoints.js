export const LEADS = {
  LIST: "/leads",
  CREATE: "/leads",
  GET_BY_ID: (id) => `/leads/${id}`,
  UPDATE: (id) => `/leads/${id}`,
  DELETE: (id) => `/leads/${id}`,
  UPDATE_STATUS: (id) => `/leads/${id}/status`,
  ASSIGN: (id) => `/leads/${id}/assign`,
  ACTIVITIES: (id) => `/leads/${id}/activities`,
  LOG_ACTIVITY: (id) => `/leads/${id}/activities`,
};

export const AI_SEARCH = {
  SEARCH: "/ai/leads/search",
  BULK_CREATE: "/ai/leads/bulk-create",
};

export const AUTH = {
  LOGIN: "/auth/login",
};

export const USERS = {
  LIST:             "/users",
  CREATE:           "/users",
  GET_BY_ID:        (id)   => `/users/${id}`,
  UPDATE:           (id)   => `/users/${id}`,
  DELETE:           (id)   => `/users/${id}`,
  CHANGE_ROLE:      (id)   => `/users/${id}/role`,
  TOGGLE_ACTIVE:    (id)   => `/users/${id}/toggle-active`,
  ME:               "/users/me",
  SALES_TEAM:       "/users/sales-team",
  BY_ROLE:          (role) => `/users/by-role/${role}`,
  CHANGE_PASSWORD:  "/users/change-password",
  AUDIT_LOGS:       "/users/audit-logs",
  AUDIT_BY_USER:    (id)   => `/users/audit-logs/${id}`,
};

export const DASHBOARD = {
  SUMMARY: "/dashboard/summary",
  RECENT_ACTIVITIES: "/activity-logs/recent",
};
