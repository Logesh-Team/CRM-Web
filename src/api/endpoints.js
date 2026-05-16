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
  EXPORT: "/leads/export",
  IMPORT: "/leads/import",
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

export const QUOTATIONS = {
  LIST:              '/quotations',
  CREATE:            '/quotations',
  GET_BY_ID:         (id) => `/quotations/${id}`,
  UPDATE:            (id) => `/quotations/${id}`,
  NEXT_NUMBER:       '/quotations/next-number',
  PREVIEW:           (id) => `/quotations/${id}/preview`,
  DOWNLOAD:          (id) => `/quotations/${id}/download`,
  APPROVAL:          (id) => `/quotations/${id}/approval`,
  SEND_EMAIL:        (id) => `/quotations/${id}/send-email`,
  SEND_WHATSAPP:     (id) => `/quotations/${id}/send-whatsapp`,
  REVISE:            (id) => `/quotations/${id}/revise`,
  BY_LEAD:           (leadId) => `/quotations/by-lead/${leadId}`,
  UPDATE_RESPONSE:   (id) => `/quotations/${id}/response`,
  APPROVAL_CONFIG:   '/quotations/config/approval-threshold',
};

export const DEMOS = {
  LIST:        '/demos',
  CREATE:      '/demos',
  GET_BY_ID:   (id) => `/demos/${id}`,
  UPDATE:      (id) => `/demos/${id}`,
  CANCEL:      (id) => `/demos/${id}/cancel`,
  POST_DEMO:   (id) => `/demos/${id}/post-demo`,
  NO_SHOW:     (id) => `/demos/${id}/no-show`,
  BY_LEAD:     (leadId) => `/demos?leadId=${leadId}`,
  UPCOMING:    '/demos?upcoming=true',
  GOOGLE_AUTH_URL: '/google/auth-url',
  GOOGLE_STATUS:   '/google/status',
};

export const DASHBOARD = {
  SUMMARY: "/dashboard/summary",
  RECENT_ACTIVITIES: "/activity-logs/recent",
};

export const CALLS = {
  BATCHES:        '/call-batches',
  BATCH:          (id) => `/call-batches/${id}`,
  BATCH_LEADS:    (id) => `/call-batches/${id}/leads`,
  BATCH_STATS:    (id) => `/call-batches/${id}/stats`,
  PAUSE:          (id) => `/call-batches/${id}/pause`,
  RESUME:         (id) => `/call-batches/${id}/resume`,
  CANCEL:         (id) => `/call-batches/${id}/cancel`,
  PREVIEW_LEADS:  '/call-batches/preview-leads',
  SCRIPTS:        '/call-scripts',
  // Legacy aliases kept for VoiceCallsPage
  CAMPAIGNS:      '/call-batches',
  CAMPAIGN:       (id) => `/call-batches/${id}`,
  CAMPAIGN_LEADS: (id) => `/call-batches/${id}/leads`,
};

export const DASHBOARD_EXEC = {
  LEADS_BY_STAGE:     '/dashboard/exec/pipeline',
  LEADS_BY_GRADE:     '/dashboard/exec/leads-by-grade',
  TODAYS_TASKS:       '/dashboard/exec/follow-ups',
  UPCOMING_MEETINGS:  '/dashboard/exec/demos',
  RECENT_ACTIVITIES:  '/dashboard/exec/activities',
  MONTHLY_TARGET:     '/dashboard/exec/target',
  SUMMARY:            '/dashboard/exec/summary',
};

export const DASHBOARD_MGR = {
  SUMMARY:            '/dashboard/manager/summary',
  PIPELINE_OVERVIEW:  '/dashboard/manager/pipeline-overview',
  CALL_BATCH_SUMMARY: '/dashboard/manager/call-batch-summary',
  CONVERSION_FUNNEL:  '/dashboard/manager/conversions',
  LEADERBOARD:        '/dashboard/manager/team-performance',
  REVENUE_FORECAST:   '/dashboard/manager/revenue-forecast',
  OVERDUE_ESCALATION: '/dashboard/manager/overdue',
};

export const FOLLOW_UPS = {
  LIST:           '/follow-ups',
  CREATE:         '/follow-ups',
  UPDATE:         (id) => `/follow-ups/${id}`,
  DELETE:         (id) => `/follow-ups/${id}`,
  SNOOZE:         (id) => `/follow-ups/${id}/snooze`,
  STATS:          '/follow-ups/stats',
  WHATSAPP_SEND:  '/follow-ups/whatsapp/send',
  WHATSAPP_LIST:  (leadId) => `/follow-ups/whatsapp/${leadId}`,
  EMAIL_SEND:     '/follow-ups/email/send',
  EMAIL_LIST:     (leadId) => `/follow-ups/email/${leadId}`,
};

export const REPORTS = {
  LEAD_SUMMARY:      '/reports/lead-summary',
  AI_CALL_BATCH:     '/reports/ai-call-batch',
  FOLLOWUP_ACTIVITY: '/reports/followup-activity',
  DEMO_PIPELINE:     '/reports/demo-pipeline',
  QUOTATION_STATUS:  '/reports/quotation-status',
  CONVERSION:        '/reports/conversions',
  OVERDUE_FOLLOWUP:  '/reports/overdue-followup',
  EXPORT_CSV:        (name) => `/reports/${name}/export/csv`,
  EXPORT_PDF:        (name) => `/reports/${name}/export/pdf`,
};
