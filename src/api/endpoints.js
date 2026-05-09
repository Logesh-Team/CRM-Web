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
  LIST: "/users",
};

export const DASHBOARD = {
  SUMMARY: "/dashboard/summary",
  RECENT_ACTIVITIES: "/activity-logs/recent",
};
