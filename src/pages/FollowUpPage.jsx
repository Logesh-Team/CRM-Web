import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Card, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, Chip, Tabs, Tab,
  Drawer, Dialog, DialogTitle, DialogContent, DialogActions,
  RadioGroup, FormControlLabel, Radio, IconButton, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Autocomplete, CircularProgress, Skeleton,
} from '@mui/material';
import {
  PhoneOutlined, TextsmsOutlined, EmailOutlined, AlarmOutlined,
  AddOutlined, CloseOutlined, CallMadeOutlined, CallReceivedOutlined,
  SendOutlined, AttachFileOutlined, CheckCircleOutlined,
  WarningAmberOutlined, DeleteOutlined, EventOutlined, AccessTimeOutlined,
  NoteOutlined, SwapHorizOutlined, SmartToyOutlined, VideocamOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { formatDate, formatDateTime } from '../utils/formatDate';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CALL_OUTCOMES = [
  { value: 'INTERESTED',         label: 'Interested',         bg: '#EAF3DE', color: '#3B6D11' },
  { value: 'NOT_INTERESTED',     label: 'Not Interested',     bg: '#FCEBEB', color: '#A32D2D' },
  { value: 'CALLBACK_REQUESTED', label: 'Callback Requested', bg: '#FAEEDA', color: '#BA7517' },
  { value: 'NO_ANSWER',          label: 'No Answer',          bg: '#F0EEE9', color: '#5A5A56' },
  { value: 'BUSY',               label: 'Busy',               bg: '#EEEDFE', color: '#534AB7' },
];

const NEXT_ACTIONS = ['FOLLOW_UP_CALL', 'SEND_BROCHURE', 'SCHEDULE_DEMO', 'SEND_EMAIL'];
const REMINDER_TYPES = ['CALL', 'MEETING', 'QUOTATION_FOLLOW_UP', 'GENERAL_TASK'];
const REMINDER_CHANNELS = ['IN_APP', 'EMAIL', 'WHATSAPP'];
const SNOOZE_OPTS = [15, 30, 60, 120, 1440];

const WA_TEMPLATES = [
  { id: 'INTRO',       label: 'Initial Introduction',   text: 'Hi {contact}, reaching out to introduce our solutions. Could we schedule a brief call this week?' },
  { id: 'BROCHURE',    label: 'Product Brochure',       text: 'Hi {contact}, sharing our product brochure as discussed. Let me know if you have any questions! 📄' },
  { id: 'DEMO_INVITE', label: 'Demo Invitation',        text: 'Hi {contact}, we\'d love to show you a live demo. Are you available for 30 mins this week?' },
  { id: 'FOLLOWUP',    label: 'Follow-up Reminder',     text: 'Hi {contact}, following up on our earlier conversation. Do you have any questions? We\'d love to move forward.' },
  { id: 'QUOTATION',   label: 'Quotation Notification', text: 'Hi {contact}, we have sent you a quotation via email. Please review it and let us know if you\'d like to discuss.' },
];

const EMAIL_TEMPLATES = [
  { id: 'INTRO',     label: 'Introduction',       subject: 'Introducing Our Solutions',                 body: 'Dear {contact},\n\nI hope this message finds you well. I am reaching out to introduce our solutions that could benefit {companyName}.\n\nI would love to schedule a brief call to understand your needs better.\n\nBest regards,' },
  { id: 'BROCHURE',  label: 'Brochure Follow-up', subject: 'Product Brochure – {companyName}',           body: 'Dear {contact},\n\nThank you for your time. As promised, please find attached our product brochure for your review.\n\nFeel free to reach out if you have any questions.\n\nBest regards,' },
  { id: 'DEMO',      label: 'Demo Confirmation',  subject: 'Demo Confirmation – {companyName}',          body: 'Dear {contact},\n\nThank you for agreeing to a demo. This email confirms our upcoming session.\n\nWe look forward to showing you our product.\n\nBest regards,' },
  { id: 'QUOTATION', label: 'Quotation Follow-up',subject: 'Following Up on Your Quotation – {companyName}', body: 'Dear {contact},\n\nI wanted to follow up on the quotation we sent recently. Have you had a chance to review it?\n\nPlease let me know if you have any questions.\n\nBest regards,' },
];

const ATTACHMENT_OPTIONS = [
  { id: 'BROCHURE',  label: 'Product Brochure' },
  { id: 'QUOTATION', label: 'Latest Quotation' },
  { id: 'CASESTUDY', label: 'Case Study' },
];

const STATUS_META = {
  SENT:      { label: 'Sent',      bg: '#E6F1FB', color: '#185FA5' },
  DELIVERED: { label: 'Delivered', bg: '#FAEEDA', color: '#BA7517' },
  READ:      { label: 'Read',      bg: '#EAF3DE', color: '#3B6D11' },
  OPENED:    { label: 'Opened',    bg: '#EAF3DE', color: '#3B6D11' },
  CLICKED:   { label: 'Clicked',   bg: '#EEEDFE', color: '#534AB7' },
  FAILED:    { label: 'Failed',    bg: '#FCEBEB', color: '#A32D2D' },
  SCHEDULED: { label: 'Scheduled', bg: '#F0EEE9', color: '#5A5A56' },
  PENDING:   { label: 'Pending',   bg: '#FAEEDA', color: '#BA7517' },
  DONE:      { label: 'Done',      bg: '#EAF3DE', color: '#3B6D11' },
  SNOOZED:   { label: 'Snoozed',   bg: '#EEEDFE', color: '#534AB7' },
  OVERDUE:   { label: 'Overdue',   bg: '#FCEBEB', color: '#A32D2D' },
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status || '—', bg: '#F0EEE9', color: '#5A5A56' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 600, background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function OutcomeBadge({ outcome }) {
  const m = CALL_OUTCOMES.find(o => o.value === outcome);
  const bg = m?.bg ?? '#F0EEE9';
  const color = m?.color ?? '#5A5A56';
  const label = m?.label ?? (outcome ? outcome.replace(/_/g, ' ') : '—');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 600, background: bg, color }}>
      {label}
    </span>
  );
}

const ACTIVITY_TYPE_META = {
  CALL:          { label: 'Call',           bg: '#E6F1FB', color: '#185FA5', Icon: PhoneOutlined },
  WHATSAPP:      { label: 'WhatsApp',       bg: '#EAF3DE', color: '#3B6D11', Icon: TextsmsOutlined },
  EMAIL:         { label: 'Email',          bg: '#F0EEE9', color: '#5A5A56', Icon: EmailOutlined },
  NOTE:          { label: 'Note',           bg: '#FAEEDA', color: '#BA7517', Icon: NoteOutlined },
  STATUS_CHANGE: { label: 'Status Change',  bg: '#FFF4CC', color: '#8B6900', Icon: SwapHorizOutlined },
  LEAD_CREATED:  { label: 'Created',        bg: '#EAF3DE', color: '#3B6D11', Icon: CheckCircleOutlined },
  AI_CALL:       { label: 'AI Call',        bg: '#EEEDFE', color: '#534AB7', Icon: SmartToyOutlined },
  DEMO:          { label: 'Demo',           bg: '#E6F7F4', color: '#0F6E56', Icon: VideocamOutlined },
};

function ActivityTypeBadge({ type }) {
  const m = ACTIVITY_TYPE_META[type] || { label: type?.replace(/_/g, ' ') || '—', bg: '#F0EEE9', color: '#5A5A56', Icon: null };
  const Icon = m.Icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600, background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>
      {Icon && <Icon style={{ fontSize: 11 }} />}
      {m.label}
    </span>
  );
}

function KpiCard({ label, value, color = '#1A1A18', Icon }) {
  return (
    <Card sx={{ flex: 1, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        {Icon && <Icon sx={{ fontSize: 16, color: '#5A5A56' }} />}
      </Box>
      <Typography sx={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'DM Mono' }}>
        {value ?? 0}
      </Typography>
    </Card>
  );
}

const CELL_SX = { fontSize: 13, color: '#1A1A18', py: 1.5 };
const HEADER_SX = { fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' };
const EMPTY_CELL_SX = { textAlign: 'center', fontSize: 13, color: '#5A5A56', py: 4 };
const TAB_SX = { fontSize: 13, textTransform: 'none', minHeight: 44, fontFamily: 'DM Sans', fontWeight: 500, '&.Mui-selected': { fontWeight: 600 } };

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FollowUpPage() {
  // Lead selector
  const [leadOption, setLeadOption] = useState(null);
  const [leadOptions, setLeadOptions] = useState([]);
  const [leadSearching, setLeadSearching] = useState(false);
  const [leadInputValue, setLeadInputValue] = useState('');
  const leadTimer = useRef(null);

  // Stats
  const [stats, setStats] = useState({});

  // Tab
  const [tab, setTab] = useState(0);

  // Call log
  const [callDrawerOpen, setCallDrawerOpen] = useState(false);
  const [callForm, setCallForm] = useState({
    direction: 'OUTGOING',
    callDate: new Date().toISOString().split('T')[0],
    callTime: '',
    contactPerson: '',
    summary: '',
    outcome: '',
    nextAction: '',
    reminderDate: '',
    reminderTime: '',
    reminderChannel: 'IN_APP',
  });
  const [callLogs, setCallLogs] = useState([]);
  const [callLoading, setCallLoading] = useState(false);
  const [callSubmitting, setCallSubmitting] = useState(false);

  // WhatsApp
  const [waTemplate, setWaTemplate] = useState(null);
  const [waCustom, setWaCustom] = useState('');
  const [waScheduled, setWaScheduled] = useState(false);
  const [waScheduleDate, setWaScheduleDate] = useState('');
  const [waScheduleTime, setWaScheduleTime] = useState('');
  const [waHistory, setWaHistory] = useState([]);
  const [waSending, setWaSending] = useState(false);

  // Email
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAttachments, setEmailAttachments] = useState([]);
  const [emailScheduled, setEmailScheduled] = useState(false);
  const [emailScheduleDate, setEmailScheduleDate] = useState('');
  const [emailScheduleTime, setEmailScheduleTime] = useState('');
  const [emailThread, setEmailThread] = useState([]);
  const [emailSending, setEmailSending] = useState(false);

  // Reminders
  const [reminders, setReminders] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({ type: 'CALL', channel: 'IN_APP', dueDate: '', dueTime: '', notes: '' });
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState(60);

  // All tasks (no lead selected)
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    axiosInstance.get('/follow-ups/stats').then(r => setStats(r.data?.data || {})).catch(() => {});
  }, []);

  useEffect(() => {
    if (leadOption) return;
    setTasksLoading(true);
    axiosInstance.get('/follow-ups', {
      params: {
        ...(taskTypeFilter && { type: taskTypeFilter }),
        ...(taskStatusFilter && { status: taskStatusFilter }),
      },
    })
      .then(r => { const d = r.data?.data; setTasks(Array.isArray(d) ? d : d?.content || []); })
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [leadOption, taskTypeFilter, taskStatusFilter]);

  // ── Lead search ───────────────────────────────────────────────────────────────

  const handleLeadInputChange = (_, value, reason) => {
    setLeadInputValue(value);
    if (reason !== 'input') return;
    if (leadTimer.current) clearTimeout(leadTimer.current);
    if (value.length < 2) { setLeadOptions([]); return; }
    leadTimer.current = setTimeout(() => {
      setLeadSearching(true);
      axiosInstance.get('/leads', { params: { search: value, size: 15 } })
        .then(r => { const d = r.data?.data; setLeadOptions(Array.isArray(d) ? d : d?.content || []); })
        .catch(() => setLeadOptions([]))
        .finally(() => setLeadSearching(false));
    }, 400);
  };

  const handleLeadChange = (_, val) => {
    setLeadOption(val);
    setLeadInputValue(val?.companyName || '');
    setTab(0);
    if (!val) return;
    fetchCallLogs(val.id);
    fetchWaHistory(val.id);
    fetchEmailThread(val.id);
    fetchReminders(val.id);
  };

  // ── Data fetchers ─────────────────────────────────────────────────────────────

  const fetchCallLogs = (id) => {
    setCallLoading(true);
    axiosInstance.get(`/leads/${id}/activities`)
      .then(r => { const d = r.data?.data; setCallLogs(Array.isArray(d) ? d : d?.content || []); })
      .catch(() => setCallLogs([]))
      .finally(() => setCallLoading(false));
  };

  const fetchWaHistory = (id) => {
    axiosInstance.get(`/follow-ups/whatsapp/${id}`)
      .then(r => { const d = r.data?.data; setWaHistory(Array.isArray(d) ? d : d?.content || []); })
      .catch(() => setWaHistory([]));
  };

  const fetchEmailThread = (id) => {
    axiosInstance.get(`/follow-ups/email/${id}`)
      .then(r => { const d = r.data?.data; setEmailThread(Array.isArray(d) ? d : d?.content || []); })
      .catch(() => setEmailThread([]));
  };

  const fetchReminders = (id) => {
    setReminderLoading(true);
    axiosInstance.get('/follow-ups', { params: { leadId: id } })
      .then(r => { const d = r.data?.data; setReminders(Array.isArray(d) ? d : d?.content || []); })
      .catch(() => setReminders([]))
      .finally(() => setReminderLoading(false));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleCallSubmit = () => {
    if (!leadOption || callSubmitting) return;
    setCallSubmitting(true);
    axiosInstance.post(`/leads/${leadOption.id}/activities`, {
      activityType: 'CALL',
      direction: callForm.direction,
      callDate: callForm.callDate,
      callTime: callForm.callTime,
      contactPerson: callForm.contactPerson,
      summary: callForm.summary,
      outcome: callForm.outcome,
      nextAction: callForm.nextAction,
      ...(callForm.reminderDate && {
        reminder: { dueDate: callForm.reminderDate, dueTime: callForm.reminderTime, channel: callForm.reminderChannel },
      }),
    })
      .then(() => {
        toast.success('Call logged');
        setCallDrawerOpen(false);
        setCallForm({ direction: 'OUTGOING', callDate: new Date().toISOString().split('T')[0], callTime: '', contactPerson: '', summary: '', outcome: '', nextAction: '', reminderDate: '', reminderTime: '', reminderChannel: 'IN_APP' });
        fetchCallLogs(leadOption.id);
      })
      .catch(() => toast.error('Failed to log call'))
      .finally(() => setCallSubmitting(false));
  };

  const waComputedText = waTemplate
    ? waTemplate.text
        .replace('{contact}', leadOption?.primaryContactName || '')
        .replace('{company}', leadOption?.companyName || '')
        .replace('{companyName}', leadOption?.companyName || '')
    : '';

  const waFullMessage = waComputedText
    ? (waCustom.trim() ? `${waComputedText}\n\n${waCustom.trim()}` : waComputedText)
    : waCustom;

  const handleWaSend = () => {
    if (!leadOption || !waFullMessage.trim() || waSending) return;
    setWaSending(true);
    axiosInstance.post('/follow-ups/whatsapp/send', {
      leadId: leadOption.id,
      message: waFullMessage,
      ...(waTemplate && { templateId: waTemplate.id }),
      ...(waScheduled && waScheduleDate && { scheduledAt: `${waScheduleDate}T${waScheduleTime || '09:00'}` }),
    })
      .then(() => {
        toast.success(waScheduled ? 'Message scheduled' : 'Message sent');
        setWaTemplate(null); setWaCustom(''); setWaScheduled(false); setWaScheduleDate(''); setWaScheduleTime('');
        fetchWaHistory(leadOption.id);
      })
      .catch(() => toast.error('Failed to send'))
      .finally(() => setWaSending(false));
  };

  const handleEmailTemplate = (templateId) => {
    setEmailTemplate(templateId);
    if (!templateId) return;
    const t = EMAIL_TEMPLATES.find(x => x.id === templateId);
    if (t) {
      setEmailSubject(t.subject.replace('{companyName}', leadOption?.companyName || ''));
      setEmailBody(t.body.replace('{contact}', leadOption?.primaryContactName || '').replace('{companyName}', leadOption?.companyName || ''));
    }
  };

  const handleEmailSend = () => {
    if (!leadOption || !emailSubject.trim() || !emailBody.trim() || emailSending) return;
    setEmailSending(true);
    axiosInstance.post('/follow-ups/email/send', {
      leadId: leadOption.id,
      subject: emailSubject,
      body: emailBody,
      attachments: emailAttachments,
      ...(emailScheduled && emailScheduleDate && { scheduledAt: `${emailScheduleDate}T${emailScheduleTime || '09:00'}` }),
    })
      .then(() => {
        toast.success(emailScheduled ? 'Email scheduled' : 'Email sent');
        setEmailSubject(''); setEmailBody(''); setEmailTemplate(''); setEmailAttachments([]); setEmailScheduled(false);
        fetchEmailThread(leadOption.id);
      })
      .catch(() => toast.error('Failed to send email'))
      .finally(() => setEmailSending(false));
  };

  const handleReminderSubmit = () => {
    if (!leadOption || !reminderForm.dueDate || reminderSubmitting) return;
    setReminderSubmitting(true);
    axiosInstance.post('/follow-ups', { leadId: leadOption.id, ...reminderForm })
      .then(() => {
        toast.success('Reminder set');
        setReminderDialogOpen(false);
        setReminderForm({ type: 'CALL', channel: 'IN_APP', dueDate: '', dueTime: '', notes: '' });
        fetchReminders(leadOption.id);
      })
      .catch(() => toast.error('Failed to set reminder'))
      .finally(() => setReminderSubmitting(false));
  };

  const handleSnooze = () => {
    if (!snoozeTarget) return;
    axiosInstance.patch(`/follow-ups/${snoozeTarget.id}/snooze`, { minutes: snoozeMinutes })
      .then(() => {
        toast.success('Reminder snoozed');
        setSnoozeOpen(false); setSnoozeTarget(null);
        if (leadOption) fetchReminders(leadOption.id);
        else setTaskTypeFilter(f => f);
      })
      .catch(() => toast.error('Failed to snooze'));
  };

  const handleMarkDone = (id) => {
    axiosInstance.patch(`/follow-ups/${id}`, { status: 'DONE' })
      .then(() => {
        toast.success('Marked as done');
        if (leadOption) fetchReminders(leadOption.id);
        else setTaskTypeFilter(f => f);
      })
      .catch(() => toast.error('Failed'));
  };

  const handleDeleteReminder = (id) => {
    axiosInstance.delete(`/follow-ups/${id}`)
      .then(() => {
        toast.success('Deleted');
        if (leadOption) fetchReminders(leadOption.id);
        else setTaskTypeFilter(f => f);
      })
      .catch(() => toast.error('Failed'));
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3, background: '#F7F6F3', minHeight: '100%' }}>

      {/* KPI Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <KpiCard label="Today's Follow-ups" value={stats.todayFollowUps ?? 0} Icon={AlarmOutlined} />
        <KpiCard label="Pending Calls" value={stats.pendingCalls ?? 0} Icon={PhoneOutlined} />
        <KpiCard label="Messages Sent" value={stats.messagesSent ?? 0} Icon={TextsmsOutlined} />
        <KpiCard
          label="Overdue"
          value={stats.overdue ?? 0}
          color={(stats.overdue ?? 0) > 0 ? '#A32D2D' : '#1A1A18'}
          Icon={WarningAmberOutlined}
        />
      </Box>

      {/* Lead Selector */}
      <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none', p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', whiteSpace: 'nowrap' }}>
            Select Lead:
          </Typography>
          <Autocomplete
            value={leadOption}
            inputValue={leadInputValue}
            onInputChange={handleLeadInputChange}
            onChange={handleLeadChange}
            options={leadOptions}
            getOptionLabel={(opt) => opt?.companyName || ''}
            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
            loading={leadSearching}
            filterOptions={(x) => x}
            noOptionsText={leadInputValue.length < 2 ? 'Type to search leads…' : 'No leads found'}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Search company or lead…"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {leadSearching && <CircularProgress size={14} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, opt) => (
              <li {...props} key={opt.id}>
                <Box sx={{ py: 0.25 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{opt.companyName}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>
                    {opt.primaryContactName} · {opt.leadStatus?.replace(/_/g, ' ')}
                  </Typography>
                </Box>
              </li>
            )}
            sx={{ flex: 1, maxWidth: 400 }}
          />
          {leadOption && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600, background: '#E6F1FB', color: '#185FA5' }}>
                {leadOption.leadStatus?.replace(/_/g, ' ') || 'NEW'}
              </span>
              {leadOption.mobile && (
                <Typography sx={{ fontSize: 12, color: '#5A5A56', fontFamily: 'DM Mono' }}>
                  {leadOption.mobile}
                </Typography>
              )}
              <Button
                size="small"
                onClick={() => { setLeadOption(null); setLeadInputValue(''); }}
                sx={{ ml: 'auto', fontSize: 11, color: '#5A5A56', textTransform: 'none' }}
              >
                Clear
              </Button>
            </>
          )}
        </Box>
      </Card>

      {leadOption ? (
        /* ── Lead Selected: Tabbed Actions ── */
        <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: '1px solid #E3E1DA', px: 1 }}
          >
            <Tab label="Activity Log" icon={<PhoneOutlined sx={{ fontSize: 15 }} />} iconPosition="start" sx={TAB_SX} />
            <Tab label="WhatsApp"  icon={<TextsmsOutlined sx={{ fontSize: 15 }} />} iconPosition="start" sx={TAB_SX} />
            <Tab label="Email"     icon={<EmailOutlined sx={{ fontSize: 15 }} />}   iconPosition="start" sx={TAB_SX} />
            <Tab label="Reminders" icon={<AlarmOutlined sx={{ fontSize: 15 }} />}   iconPosition="start" sx={TAB_SX} />
          </Tabs>

          <Box sx={{ p: 2.5 }}>

            {/* ── Call Log Tab ── */}
            {tab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="contained" size="small" startIcon={<AddOutlined />}
                    onClick={() => setCallDrawerOpen(true)}
                    sx={{ background: '#1A1A18', '&:hover': { background: '#333' }, fontSize: 13, textTransform: 'none' }}
                  >
                    Log Call
                  </Button>
                </Box>
                {callLoading ? (
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '8px' }} />
                ) : (
                  <TableContainer sx={{ border: '1px solid #E3E1DA', borderRadius: '8px' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: '#F7F6F3' }}>
                          {['Type', 'Direction', 'Date & Time', 'Contact', 'Outcome', 'Next Action', 'Summary'].map(h => (
                            <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {callLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} sx={EMPTY_CELL_SX}>No activities logged for this lead yet.</TableCell>
                          </TableRow>
                        ) : callLogs.map((log, i) => (
                          <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                            <TableCell sx={CELL_SX}>
                              <ActivityTypeBadge type={log.activityType} />
                            </TableCell>
                            <TableCell sx={CELL_SX}>
                              {log.activityType === 'CALL' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {log.direction === 'INCOMING'
                                    ? <CallReceivedOutlined sx={{ fontSize: 14, color: '#3B6D11' }} />
                                    : <CallMadeOutlined sx={{ fontSize: 14, color: '#185FA5' }} />
                                  }
                                  <Typography sx={{ fontSize: 12 }}>
                                    {log.direction === 'INCOMING' ? 'Incoming' : log.direction === 'OUTGOING' ? 'Outgoing' : '—'}
                                  </Typography>
                                </Box>
                              ) : <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>—</Typography>}
                            </TableCell>
                            <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', fontSize: 12 }}>
                              {log.callDate
                                ? `${formatDate(log.callDate)}${log.callTime ? ' ' + log.callTime.substring(0, 5) : ''}`
                                : log.performedAt ? formatDateTime(log.performedAt) : '—'}
                            </TableCell>
                            <TableCell sx={CELL_SX}>{log.contactPerson || '—'}</TableCell>
                            <TableCell sx={CELL_SX}>
                              {log.outcome ? <OutcomeBadge outcome={log.outcome} /> : <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>—</Typography>}
                            </TableCell>
                            <TableCell sx={CELL_SX}>{log.nextAction ? log.nextAction.replace(/_/g, ' ') : '—'}</TableCell>
                            <TableCell sx={{ ...CELL_SX, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.summary || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* ── WhatsApp Tab ── */}
            {tab === 1 && (
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', mb: 1.5 }}>Choose Template</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {WA_TEMPLATES.map(t => {
                    const selected = waTemplate?.id === t.id;
                    return (
                      <Chip
                        key={t.id} label={t.label}
                        onClick={() => setWaTemplate(selected ? null : t)}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          fontSize: 12, cursor: 'pointer',
                          background: selected ? '#1A1A18' : 'transparent',
                          color: selected ? '#fff' : '#1A1A18',
                          borderColor: '#E3E1DA',
                          '&:hover': { background: selected ? '#1A1A18' : '#F0EEE9' },
                        }}
                      />
                    );
                  })}
                </Box>

                {waTemplate && (
                  <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '8px', boxShadow: 'none', p: 1.5, mb: 2, background: '#F7F6F3' }}>
                    <Typography sx={{ fontSize: 12, color: '#5A5A56', lineHeight: 1.6 }}>
                      {waComputedText}
                    </Typography>
                  </Card>
                )}

                <TextField
                  fullWidth multiline rows={3} size="small"
                  label={waTemplate ? 'Additional message (optional)' : 'Custom message'}
                  value={waCustom}
                  onChange={e => setWaCustom(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant={waScheduled ? 'contained' : 'outlined'}
                    startIcon={<EventOutlined sx={{ fontSize: 14 }} />}
                    onClick={() => setWaScheduled(s => !s)}
                    sx={{
                      fontSize: 12, textTransform: 'none',
                      borderColor: '#E3E1DA',
                      color: waScheduled ? '#fff' : '#5A5A56',
                      background: waScheduled ? '#534AB7' : 'transparent',
                      '&:hover': { background: waScheduled ? '#3f37a0' : '#F0EEE9', borderColor: '#534AB7' },
                    }}
                  >
                    Schedule
                  </Button>
                  {waScheduled && (
                    <>
                      <TextField size="small" type="date" label="Date" value={waScheduleDate} onChange={e => setWaScheduleDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                      <TextField size="small" type="time" label="Time" value={waScheduleTime} onChange={e => setWaScheduleTime(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 130 }} />
                    </>
                  )}
                  <Box sx={{ ml: 'auto' }}>
                    <Button
                      variant="contained" size="small"
                      startIcon={<SendOutlined sx={{ fontSize: 14 }} />}
                      onClick={handleWaSend}
                      disabled={!waFullMessage.trim() || waSending}
                      sx={{ background: '#3B6D11', '&:hover': { background: '#2e540d' }, fontSize: 13, textTransform: 'none' }}
                    >
                      {waSending ? 'Sending…' : waScheduled ? 'Schedule Message' : 'Send WhatsApp'}
                    </Button>
                  </Box>
                </Box>

                {waHistory.length > 0 && (
                  <>
                    <Divider sx={{ mb: 2 }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
                      Message History
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {waHistory.map((msg, i) => (
                        <Box key={i} sx={{ border: '1px solid #E3E1DA', borderRadius: '8px', p: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                            <Typography sx={{ fontSize: 13, color: '#1A1A18', flex: 1, pr: 1 }}>
                              {msg.message || msg.text || '—'}
                            </Typography>
                            <StatusBadge status={msg.status || 'SENT'} />
                          </Box>
                          <Typography sx={{ fontSize: 11, color: '#5A5A56', fontFamily: 'DM Mono' }}>
                            {msg.sentAt ? formatDateTime(msg.sentAt) : (msg.scheduledAt ? `Scheduled: ${formatDateTime(msg.scheduledAt)}` : '—')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}

            {/* ── Email Tab ── */}
            {tab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Template</InputLabel>
                    <Select value={emailTemplate} onChange={e => handleEmailTemplate(e.target.value)} label="Template">
                      <MenuItem value="" sx={{ fontSize: 13 }}>No template</MenuItem>
                      {EMAIL_TEMPLATES.map(t => (
                        <MenuItem key={t.id} value={t.id} sx={{ fontSize: 13 }}>{t.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small" label="To"
                    value={leadOption?.email || leadOption?.contactEmail || ''}
                    disabled sx={{ flex: 1 }}
                  />
                </Box>

                <TextField
                  fullWidth size="small" label="Subject"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth multiline rows={7} size="small" label="Message"
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  sx={{ mb: 2, '& .MuiInputBase-root': { fontFamily: 'DM Mono', fontSize: 12 } }}
                />

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#5A5A56', mb: 1 }}>Attachments</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {ATTACHMENT_OPTIONS.map(att => {
                      const selected = emailAttachments.includes(att.id);
                      return (
                        <Chip
                          key={att.id} label={att.label}
                          icon={<AttachFileOutlined sx={{ fontSize: 13 }} />}
                          onClick={() => setEmailAttachments(prev => selected ? prev.filter(x => x !== att.id) : [...prev, att.id])}
                          variant={selected ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: 12, cursor: 'pointer',
                            background: selected ? '#185FA5' : 'transparent',
                            color: selected ? '#fff' : '#1A1A18',
                            borderColor: '#E3E1DA',
                            '& .MuiChip-icon': { color: selected ? '#fff' : '#5A5A56' },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant={emailScheduled ? 'contained' : 'outlined'}
                    startIcon={<EventOutlined sx={{ fontSize: 14 }} />}
                    onClick={() => setEmailScheduled(s => !s)}
                    sx={{
                      fontSize: 12, textTransform: 'none',
                      borderColor: '#E3E1DA',
                      color: emailScheduled ? '#fff' : '#5A5A56',
                      background: emailScheduled ? '#534AB7' : 'transparent',
                      '&:hover': { background: emailScheduled ? '#3f37a0' : '#F0EEE9', borderColor: '#534AB7' },
                    }}
                  >
                    Schedule
                  </Button>
                  {emailScheduled && (
                    <>
                      <TextField size="small" type="date" label="Date" value={emailScheduleDate} onChange={e => setEmailScheduleDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                      <TextField size="small" type="time" label="Time" value={emailScheduleTime} onChange={e => setEmailScheduleTime(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 130 }} />
                    </>
                  )}
                  <Box sx={{ ml: 'auto' }}>
                    <Button
                      variant="contained" size="small"
                      startIcon={<SendOutlined sx={{ fontSize: 14 }} />}
                      onClick={handleEmailSend}
                      disabled={!emailSubject.trim() || !emailBody.trim() || emailSending}
                      sx={{ background: '#1A1A18', '&:hover': { background: '#333' }, fontSize: 13, textTransform: 'none' }}
                    >
                      {emailSending ? 'Sending…' : emailScheduled ? 'Schedule Email' : 'Send Email'}
                    </Button>
                  </Box>
                </Box>

                {emailThread.length > 0 && (
                  <>
                    <Divider sx={{ mb: 2 }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
                      Email Thread
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {emailThread.map((email, i) => (
                        <Box key={i} sx={{ border: '1px solid #E3E1DA', borderRadius: '8px', p: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18' }}>
                              {email.subject || '(no subject)'}
                            </Typography>
                            <StatusBadge status={email.status || 'SENT'} />
                          </Box>
                          <Typography sx={{ fontSize: 11, color: '#5A5A56', mb: 0.75, fontFamily: 'DM Mono' }}>
                            {email.sentAt ? formatDateTime(email.sentAt) : (email.scheduledAt ? `Scheduled: ${formatDateTime(email.scheduledAt)}` : '—')}
                          </Typography>
                          {email.body && (
                            <Typography sx={{ fontSize: 12, color: '#1A1A18', whiteSpace: 'pre-wrap', fontFamily: 'DM Mono' }}>
                              {email.body.substring(0, 200)}{email.body.length > 200 ? '…' : ''}
                            </Typography>
                          )}
                          {email.attachments?.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                              {email.attachments.map((a, j) => (
                                <Chip key={j} label={a} size="small" icon={<AttachFileOutlined sx={{ fontSize: 12 }} />} sx={{ fontSize: 11, height: 20 }} />
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}

            {/* ── Reminders Tab ── */}
            {tab === 3 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="contained" size="small" startIcon={<AddOutlined />}
                    onClick={() => setReminderDialogOpen(true)}
                    sx={{ background: '#1A1A18', '&:hover': { background: '#333' }, fontSize: 13, textTransform: 'none' }}
                  >
                    Add Reminder
                  </Button>
                </Box>
                {reminderLoading ? (
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '8px' }} />
                ) : (
                  <TableContainer sx={{ border: '1px solid #E3E1DA', borderRadius: '8px' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: '#F7F6F3' }}>
                          {['Type', 'Channel', 'Due Date', 'Status', 'Notes', 'Actions'].map(h => (
                            <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reminders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} sx={EMPTY_CELL_SX}>No reminders set.</TableCell>
                          </TableRow>
                        ) : reminders.map((r, i) => (
                          <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' }, background: r.status === 'OVERDUE' ? '#FFF9F9' : 'transparent' }}>
                            <TableCell sx={CELL_SX}>{r.type?.replace(/_/g, ' ') || '—'}</TableCell>
                            <TableCell sx={CELL_SX}>{r.channel?.replace(/_/g, ' ') || '—'}</TableCell>
                            <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', fontSize: 12 }}>
                              {r.dueDate ? formatDate(r.dueDate) : '—'}{r.dueTime ? ` ${r.dueTime.substring(0, 5)}` : ''}
                            </TableCell>
                            <TableCell sx={CELL_SX}><StatusBadge status={r.status || 'PENDING'} /></TableCell>
                            <TableCell sx={{ ...CELL_SX, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.notes || '—'}
                            </TableCell>
                            <TableCell sx={CELL_SX}>
                              <Box sx={{ display: 'flex', gap: 0.25 }}>
                                {r.status !== 'DONE' && (
                                  <>
                                    <IconButton size="small" title="Mark Done" onClick={() => handleMarkDone(r.id)}
                                      sx={{ color: '#3B6D11', '&:hover': { background: '#EAF3DE' } }}>
                                      <CheckCircleOutlined sx={{ fontSize: 15 }} />
                                    </IconButton>
                                    <IconButton size="small" title="Snooze" onClick={() => { setSnoozeTarget(r); setSnoozeOpen(true); }}
                                      sx={{ color: '#534AB7', '&:hover': { background: '#EEEDFE' } }}>
                                      <AccessTimeOutlined sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </>
                                )}
                                <IconButton size="small" title="Delete" onClick={() => handleDeleteReminder(r.id)}
                                  sx={{ color: '#A32D2D', '&:hover': { background: '#FCEBEB' } }}>
                                  <DeleteOutlined sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

          </Box>
        </Card>
      ) : (
        /* ── No Lead: All Tasks Overview ── */
        <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #E3E1DA', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1A1A18', mr: 'auto' }}>
              All Follow-up Tasks
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select value={taskTypeFilter} onChange={e => setTaskTypeFilter(e.target.value)} label="Type">
                <MenuItem value="" sx={{ fontSize: 13 }}>All Types</MenuItem>
                {REMINDER_TYPES.map(t => (
                  <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value)} label="Status">
                <MenuItem value="" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
                {['PENDING', 'DONE', 'SNOOZED', 'OVERDUE'].map(s => (
                  <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: '#F7F6F3' }}>
                  {['Lead / Company', 'Type', 'Channel', 'Due Date', 'Status', 'Notes', 'Actions'].map(h => (
                    <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tasksLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton height={20} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={EMPTY_CELL_SX}>No follow-up tasks found.</TableCell>
                  </TableRow>
                ) : tasks.map((task, i) => (
                  <TableRow
                    key={i}
                    sx={{ '&:hover': { background: '#F7F6F3' }, background: task.status === 'OVERDUE' ? '#FFF9F9' : 'transparent' }}
                  >
                    <TableCell sx={{ ...CELL_SX, fontWeight: 500 }}>{task.companyName || task.leadName || '—'}</TableCell>
                    <TableCell sx={CELL_SX}>{task.type?.replace(/_/g, ' ') || '—'}</TableCell>
                    <TableCell sx={CELL_SX}>{task.channel?.replace(/_/g, ' ') || '—'}</TableCell>
                    <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', fontSize: 12 }}>
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </TableCell>
                    <TableCell sx={CELL_SX}><StatusBadge status={task.status || 'PENDING'} /></TableCell>
                    <TableCell sx={{ ...CELL_SX, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.notes || '—'}
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <Box sx={{ display: 'flex', gap: 0.25 }}>
                        {task.status !== 'DONE' && (
                          <>
                            <IconButton size="small" onClick={() => handleMarkDone(task.id)}
                              sx={{ color: '#3B6D11', '&:hover': { background: '#EAF3DE' } }}>
                              <CheckCircleOutlined sx={{ fontSize: 15 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSnoozeTarget(task); setSnoozeOpen(true); }}
                              sx={{ color: '#534AB7', '&:hover': { background: '#EEEDFE' } }}>
                              <AccessTimeOutlined sx={{ fontSize: 15 }} />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ── Log Call Drawer ── */}
      <Drawer
        anchor="right"
        open={callDrawerOpen}
        onClose={() => setCallDrawerOpen(false)}
        PaperProps={{ sx: { width: 440, display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: '1px solid #E3E1DA', flexShrink: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1A1A18' }}>Log Call</Typography>
          <IconButton size="small" onClick={() => setCallDrawerOpen(false)}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#5A5A56', mb: 0.75 }}>Direction</Typography>
            <RadioGroup row value={callForm.direction} onChange={e => setCallForm(f => ({ ...f, direction: e.target.value }))}>
              <FormControlLabel value="OUTGOING" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>Outgoing</Typography>} />
              <FormControlLabel value="INCOMING" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>Incoming</Typography>} />
            </RadioGroup>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small" type="date" label="Date" fullWidth
              value={callForm.callDate}
              onChange={e => setCallForm(f => ({ ...f, callDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small" type="time" label="Time" fullWidth
              value={callForm.callTime}
              onChange={e => setCallForm(f => ({ ...f, callTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            size="small" fullWidth label="Contact Person"
            value={callForm.contactPerson}
            onChange={e => setCallForm(f => ({ ...f, contactPerson: e.target.value }))}
            placeholder={leadOption?.primaryContactName || ''}
          />

          <TextField
            size="small" fullWidth multiline rows={3} label="Call Summary"
            value={callForm.summary}
            onChange={e => setCallForm(f => ({ ...f, summary: e.target.value }))}
            placeholder="What was discussed…"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Outcome</InputLabel>
            <Select value={callForm.outcome} onChange={e => setCallForm(f => ({ ...f, outcome: e.target.value }))} label="Outcome">
              <MenuItem value="" sx={{ fontSize: 13 }}>Select outcome</MenuItem>
              {CALL_OUTCOMES.map(o => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: o.color, flexShrink: 0 }} />
                    {o.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Next Action</InputLabel>
            <Select value={callForm.nextAction} onChange={e => setCallForm(f => ({ ...f, nextAction: e.target.value }))} label="Next Action">
              <MenuItem value="" sx={{ fontSize: 13 }}>Select action</MenuItem>
              {NEXT_ACTIONS.map(a => (
                <MenuItem key={a} value={a} sx={{ fontSize: 13 }}>{a.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Set Reminder (optional)
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small" type="date" label="Reminder Date" fullWidth
              value={callForm.reminderDate}
              onChange={e => setCallForm(f => ({ ...f, reminderDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small" type="time" label="Time" fullWidth
              value={callForm.reminderTime}
              onChange={e => setCallForm(f => ({ ...f, reminderTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>Reminder Channel</InputLabel>
            <Select value={callForm.reminderChannel} onChange={e => setCallForm(f => ({ ...f, reminderChannel: e.target.value }))} label="Reminder Channel">
              {REMINDER_CHANNELS.map(c => (
                <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid #E3E1DA', flexShrink: 0, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button size="small" onClick={() => setCallDrawerOpen(false)} sx={{ fontSize: 13, textTransform: 'none', color: '#5A5A56' }}>
            Cancel
          </Button>
          <Button
            variant="contained" size="small"
            onClick={handleCallSubmit}
            disabled={callSubmitting}
            sx={{ background: '#1A1A18', '&:hover': { background: '#333' }, fontSize: 13, textTransform: 'none' }}
          >
            {callSubmitting ? 'Saving…' : 'Log Call'}
          </Button>
        </Box>
      </Drawer>

      {/* ── Add Reminder Dialog ── */}
      <Dialog open={reminderDialogOpen} onClose={() => setReminderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>Add Reminder</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={reminderForm.type} onChange={e => setReminderForm(f => ({ ...f, type: e.target.value }))} label="Type">
              {REMINDER_TYPES.map(t => (
                <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Channel</InputLabel>
            <Select value={reminderForm.channel} onChange={e => setReminderForm(f => ({ ...f, channel: e.target.value }))} label="Channel">
              {REMINDER_CHANNELS.map(c => (
                <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small" type="date" label="Date" fullWidth required
              value={reminderForm.dueDate}
              onChange={e => setReminderForm(f => ({ ...f, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small" type="time" label="Time" fullWidth
              value={reminderForm.dueTime}
              onChange={e => setReminderForm(f => ({ ...f, dueTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            size="small" fullWidth multiline rows={2} label="Notes"
            value={reminderForm.notes}
            onChange={e => setReminderForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Optional note…"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setReminderDialogOpen(false)} sx={{ fontSize: 12, color: '#5A5A56' }}>Cancel</Button>
          <Button
            size="small" variant="contained"
            onClick={handleReminderSubmit}
            disabled={!reminderForm.dueDate || reminderSubmitting}
            sx={{ fontSize: 12, background: '#1A1A18', '&:hover': { background: '#333' } }}
          >
            {reminderSubmitting ? 'Saving…' : 'Set Reminder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snooze Dialog ── */}
      <Dialog open={snoozeOpen} onClose={() => setSnoozeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>Snooze Reminder</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: '#5A5A56', mb: 2 }}>
            How long would you like to snooze?
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {SNOOZE_OPTS.map(m => {
              const label = m < 60 ? `${m} min` : m === 1440 ? '1 day' : `${m / 60}h`;
              return (
                <Chip
                  key={m} label={label}
                  onClick={() => setSnoozeMinutes(m)}
                  variant={snoozeMinutes === m ? 'filled' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    background: snoozeMinutes === m ? '#534AB7' : 'transparent',
                    color: snoozeMinutes === m ? '#fff' : '#1A1A18',
                    borderColor: '#E3E1DA',
                  }}
                />
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setSnoozeOpen(false)} sx={{ fontSize: 12, color: '#5A5A56' }}>Cancel</Button>
          <Button
            size="small" variant="contained"
            onClick={handleSnooze}
            sx={{ fontSize: 12, background: '#534AB7', '&:hover': { background: '#3f37a0' } }}
          >
            Snooze
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
