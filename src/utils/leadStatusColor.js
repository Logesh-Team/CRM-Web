export const STATUS_COLORS = {
  NEW:                          { bg: '#F0EEE9', text: '#5A5A56', border: '#E3E1DA' },
  AI_CALL_SCHEDULED:            { bg: '#EEEDFE', text: '#534AB7', border: '#C5C2F5' },
  AI_CALL_DONE_INTERESTED:      { bg: '#E1F5EE', text: '#0F6E56', border: '#A5DFD0' },
  AI_CALL_DONE_NOT_INTERESTED:  { bg: '#FCEBEB', text: '#A32D2D', border: '#F0B8B8' },
  IN_FOLLOW_UP:                 { bg: '#E6F1FB', text: '#185FA5', border: '#A8CFEF' },
  DEMO_SCHEDULED:               { bg: '#E1F5EE', text: '#0F6E56', border: '#A5DFD0' },
  DEMO_DONE:                    { bg: '#E1F5EE', text: '#0F6E56', border: '#A5DFD0' },
  QUOTATION_SENT:               { bg: '#FAEEDA', text: '#BA7517', border: '#F0D09A' },
  NEGOTIATION:                  { bg: '#FAEEDA', text: '#BA7517', border: '#F0D09A' },
  CONVERTED_WON:                { bg: '#EAF3DE', text: '#3B6D11', border: '#B5D98C' },
  CLOSED_LOST:                  { bg: '#FCEBEB', text: '#A32D2D', border: '#F0B8B8' },
  ON_HOLD:                      { bg: '#F0EEE9', text: '#5A5A56', border: '#E3E1DA' },
};

export const PRIORITY_COLORS = {
  HOT:  { bg: '#FCEBEB', text: '#A32D2D' },
  WARM: { bg: '#FAEEDA', text: '#BA7517' },
  COLD: { bg: '#E6F1FB', text: '#185FA5' },
};

export const GRADE_COLORS = {
  A: { bg: '#EAF3DE', text: '#3B6D11' },
  B: { bg: '#E6F1FB', text: '#185FA5' },
  C: { bg: '#FAEEDA', text: '#BA7517' },
  D: { bg: '#FCEBEB', text: '#A32D2D' },
};

export const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.NEW;
export const getPriorityColor = (priority) => PRIORITY_COLORS[priority] || PRIORITY_COLORS.COLD;
export const getGradeColor = (grade) => GRADE_COLORS[grade] || { bg: '#F0EEE9', text: '#5A5A56' };

export const STATUS_LABELS = {
  NEW: 'New',
  AI_CALL_SCHEDULED: 'AI Call Scheduled',
  AI_CALL_DONE_INTERESTED: 'AI Call Done · Interested',
  AI_CALL_DONE_NOT_INTERESTED: 'AI Call Done · Not Interested',
  IN_FOLLOW_UP: 'In Follow-up',
  DEMO_SCHEDULED: 'Demo Scheduled',
  DEMO_DONE: 'Demo Done',
  QUOTATION_SENT: 'Quotation Sent',
  NEGOTIATION: 'Negotiation',
  CONVERTED_WON: 'Converted / Won',
  CLOSED_LOST: 'Closed Lost',
  ON_HOLD: 'On Hold',
};
