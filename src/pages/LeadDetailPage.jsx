import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Drawer, CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  EditOutlined, PhoneOutlined, ChatOutlined, EmailOutlined,
  VideocamOutlined, DescriptionOutlined, AlarmOutlined,
  SwapHorizOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchLeadById, fetchLeadActivities, logActivity, updateLeadStatus } from '../features/leads/leadsSlice';
import StatusBadge from '../components/common/StatusBadge';
import GradeBadge from '../components/common/GradeBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import PageWrapper from '../components/common/PageWrapper';
import { formatDateTime, timeAgo } from '../utils/formatDate';
import { formatINR } from '../utils/formatCurrency';
import { getAllowedNextStatuses } from '../utils/leadStatusTransitions';
import { STATUS_LABELS } from '../utils/leadStatusColor';

const ACTIVITY_TYPES = ['CALL','WHATSAPP','EMAIL','NOTE','MEETING','DEMO','STATUS_CHANGE','AI_CALL'];

const ACTIVITY_COLORS = {
  CALL: '#185FA5', WHATSAPP: '#3B6D11', EMAIL: '#5A5A56',
  AI_CALL: '#534AB7', STATUS_CHANGE: '#BA7517', NOTE: '#5A5A56',
  MEETING: '#0F6E56', DEMO: '#0F6E56',
};

function FieldRow({ label, value, mono, link, href }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
        {label}
      </Typography>
      {link && value ? (
        <Typography component="a" href={href || '#'} target="_blank" rel="noopener noreferrer"
          sx={{ fontSize: 12, color: '#185FA5', textDecoration: 'none', fontFamily: mono ? 'DM Mono' : 'DM Sans' }}>
          {value}
        </Typography>
      ) : (
        <Typography sx={{ fontSize: 12, color: '#1A1A18', fontFamily: mono ? 'DM Mono' : 'DM Sans', wordBreak: 'break-word' }}>
          {value || '—'}
        </Typography>
      )}
    </Box>
  );
}

function LogActivityDrawer({ open, onClose, leadId, onSuccess }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ activityType: 'CALL', contactPerson: '', summary: '', outcome: '', nextAction: '', reminderDate: '', durationMinutes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.summary) { toast.error('Summary is required'); return; }
    setSubmitting(true);
    const result = await dispatch(logActivity({ id: leadId, data: form }));
    setSubmitting(false);
    if (logActivity.fulfilled.match(result)) {
      toast.success('Activity logged');
      onSuccess();
      onClose();
      setForm({ activityType: 'CALL', contactPerson: '', summary: '', outcome: '', nextAction: '', reminderDate: '', durationMinutes: '' });
    } else {
      toast.error(result.payload || 'Failed to log activity');
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400, p: 3 } }}>
      <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 3 }}>Log Activity</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Activity Type</InputLabel>
          <Select label="Activity Type" value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })}>
            {ACTIVITY_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
        <TextField size="small" label="Summary *" multiline rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <TextField size="small" label="Outcome" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
        <TextField size="small" label="Next Action" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} />
        <TextField size="small" label="Reminder Date" type="date" InputLabelProps={{ shrink: true }} value={form.reminderDate} onChange={(e) => setForm({ ...form, reminderDate: e.target.value })} />
        <TextField size="small" label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
          <Button variant="outlined" onClick={onClose} fullWidth size="small" color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} fullWidth size="small" disabled={submitting}>
            {submitting ? <CircularProgress size={16} color="inherit" /> : 'Log Activity'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

function UpdateStatusDialog({ open, onClose, lead, onSuccess }) {
  const dispatch = useDispatch();
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const allowedStatuses = getAllowedNextStatuses(lead?.leadStatus);

  const handleSubmit = async () => {
    if (!newStatus) { toast.error('Select a status'); return; }
    setSubmitting(true);
    const result = await dispatch(updateLeadStatus({ id: lead.id, newStatus, reason }));
    setSubmitting(false);
    if (updateLeadStatus.fulfilled.match(result)) {
      toast.success('Status updated');
      onSuccess();
      onClose();
    } else {
      toast.error(result.payload || 'Failed to update status');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>Update Lead Status</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: 13 }}>Current:</Typography>
          <StatusBadge status={lead?.leadStatus} />
          <SwapHorizOutlined sx={{ color: '#5A5A56', fontSize: 16 }} />
        </Box>
        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
          <InputLabel>New Status</InputLabel>
          <Select label="New Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {allowedStatuses.map((s) => <MenuItem key={s} value={s}>{STATUS_LABELS[s] || s}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" fullWidth label="Reason (optional)" multiline rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" size="small" disabled={submitting || !newStatus}>
          {submitting ? <CircularProgress size={16} color="inherit" /> : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedLead: lead, loading, error, activities, activitiesLoading } = useSelector((state) => state.leads);

  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchLeadById(id));
      dispatch(fetchLeadActivities(id));
    }
  }, [id, dispatch]);

  const refreshActivities = () => dispatch(fetchLeadActivities(id));

  const getInitials = (name) => name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const QUICK_ACTIONS = [
    { label: 'Log Call', icon: PhoneOutlined, href: null },
    { label: 'WhatsApp', icon: ChatOutlined, href: lead?.whatsappNumber ? `https://wa.me/91${lead.whatsappNumber}` : null },
    { label: 'Send Email', icon: EmailOutlined, href: lead?.email ? `mailto:${lead.email}` : null },
    { label: 'Schedule Demo', icon: VideocamOutlined, href: null },
    { label: 'Create Quote', icon: DescriptionOutlined, href: null },
    { label: 'Set Reminder', icon: AlarmOutlined, href: null },
  ];

  if (loading && !lead) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <CircularProgress />
    </Box>
  );

  if (error) return <ApiErrorAlert error={error} />;
  if (!lead) return null;

  return (
    <PageWrapper
      title={lead.companyName}
      breadcrumbs={[{ label: 'All Leads', path: '/leads' }, { label: lead.companyName }]}
    >
      <Box sx={{ display: 'flex', gap: 2.5 }}>
        {/* Left column */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {/* Company card */}
          <Card>
            <CardContent sx={{ p: '20px 24px' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{ width: 44, height: 44, borderRadius: '10px', background: '#534AB7', fontSize: 15, fontWeight: 700 }}
                >
                  {getInitials(lead.companyName)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1A1A18' }}>{lead.companyName}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>
                    {[lead.city, lead.industryType].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <GradeBadge grade={lead.leadGrade} />
                  <PriorityBadge priority={lead.leadPriority} />
                  <StatusBadge status={lead.leadStatus} />
                  <Tooltip title="Edit Lead">
                    <IconButton size="small" onClick={() => navigate(`/leads/${id}/edit`)}>
                      <EditOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Status bar */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#F7F6F3',
                  border: '1px solid #E3E1DA',
                  borderRadius: '8px',
                  px: 2,
                  py: 1.5,
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>Status:</Typography>
                  <StatusBadge status={lead.leadStatus} />
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SwapHorizOutlined />}
                  onClick={() => setStatusDialogOpen(true)}
                  sx={{ fontSize: 12, borderColor: '#E3E1DA', color: '#1A1A18' }}
                >
                  Update Status
                </Button>
              </Box>

              {/* Fields grid */}
              <Grid container spacing={2.5}>
                {[
                  { label: 'Lead ID', value: lead.leadId || lead.id, mono: true },
                  { label: 'Industry', value: lead.industryType },
                  { label: 'Sub-Industry', value: lead.subIndustry },
                  { label: 'Company Size', value: lead.companySize },
                  { label: 'Contact Name', value: lead.primaryContactName },
                  { label: 'Designation', value: lead.designation },
                  { label: 'Mobile', value: lead.mobile, link: true, href: `tel:${lead.mobile}` },
                  { label: 'Email', value: lead.email, link: true, href: `mailto:${lead.email}` },
                  { label: 'WhatsApp', value: lead.whatsappNumber },
                  { label: 'Website', value: lead.website, link: true, href: lead.website },
                  { label: 'GST Number', value: lead.gstNumber, mono: true },
                  { label: 'Lead Source', value: lead.leadSource },
                  { label: 'Campaign', value: lead.campaignName },
                  { label: 'Territory', value: lead.territory },
                  { label: 'Deal Value', value: lead.estimatedDealValue ? formatINR(lead.estimatedDealValue) : null, mono: true },
                  { label: 'Expected Revenue Month', value: lead.expectedRevenueMonth },
                  { label: 'Product Interested', value: lead.productInterested },
                  { label: 'Assigned To', value: lead.assignedToName },
                  { label: 'Assigned Manager', value: lead.assignedManagerName },
                  { label: 'Created By', value: lead.createdByName },
                  { label: 'Created At', value: formatDateTime(lead.createdAt) },
                ].map((f) => (
                  <Grid item xs={6} sm={4} key={f.label}>
                    <FieldRow {...f} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Quick Actions card */}
          <Card>
            <CardContent sx={{ p: '16px 24px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const btn = (
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<Icon sx={{ fontSize: 15 }} />}
                      onClick={action.label === 'Log Call' ? () => setActivityDrawerOpen(true) : undefined}
                      component={action.href ? 'a' : 'button'}
                      href={action.href}
                      target={action.href ? '_blank' : undefined}
                      rel={action.href ? 'noopener noreferrer' : undefined}
                      sx={{ height: 40, fontSize: 12, borderColor: '#E3E1DA', color: '#1A1A18' }}
                    >
                      {action.label}
                    </Button>
                  );
                  return <Grid item xs={6} sm={4} key={action.label}>{btn}</Grid>;
                })}
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Right column — Activity Timeline */}
        <Box sx={{ width: 340, flexShrink: 0 }}>
          <Card sx={{ height: 'fit-content', position: 'sticky', top: 0 }}>
            <CardContent sx={{ p: '16px 20px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Activity Timeline</Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setActivityDrawerOpen(true)}
                  sx={{ fontSize: 11, height: 30 }}
                >
                  Log Activity
                </Button>
              </Box>

              {activitiesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : activities.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: '#5A5A56', textAlign: 'center', py: 4 }}>
                  No activities logged yet
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activities.map((activity, i) => {
                    const dotColor = ACTIVITY_COLORS[activity.activityType] || '#5A5A56';
                    return (
                      <Box key={activity.id || i} sx={{ display: 'flex', gap: 1.5, pb: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: dotColor,
                              mt: 0.5,
                              flexShrink: 0,
                            }}
                          />
                          {i < activities.length - 1 && (
                            <Box sx={{ width: 1, flex: 1, background: '#E3E1DA', mt: 0.5 }} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, pb: i < activities.length - 1 ? 1 : 0 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1A1A18' }}>
                            {activity.activityType?.replace('_', ' ')}
                          </Typography>
                          {activity.summary && (
                            <Typography sx={{ fontSize: 11, color: '#5A5A56', mt: 0.25, wordBreak: 'break-word' }}>
                              {activity.summary}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#5A5A56', mt: 0.5 }}>
                            {timeAgo(activity.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <LogActivityDrawer
        open={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
        leadId={id}
        onSuccess={refreshActivities}
      />
      <UpdateStatusDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        lead={lead}
        onSuccess={() => dispatch(fetchLeadById(id))}
      />
    </PageWrapper>
  );
}
