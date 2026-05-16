import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, FormControl, InputLabel, Select,
  MenuItem, Chip, Box, Typography, IconButton, CircularProgress, Alert,
} from '@mui/material';
import { AddOutlined, DeleteOutlined, LinkOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { scheduleDemo, openDemoDialog } from '../features/demos/demosSlice';
import { fetchUsers } from '../features/users/usersSlice';
import { fetchLeads } from '../features/leads/leadsSlice';
import axiosInstance from '../api/axiosInstance';
import { DEMOS } from '../api/endpoints';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { v: 'GOOGLE_MEET', l: 'Google Meet' },
  { v: 'ZOOM', l: 'Zoom' },
  { v: 'IN_PERSON', l: 'In Person' },
  { v: 'OTHER', l: 'Other' },
];

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const empty = {
  leadId: '',
  title: '',
  scheduledAt: '',
  durationMinutes: 60,
  platform: 'GOOGLE_MEET',
  location: '',
  assignedTo: '',
  notes: '',
  participants: [],
  agendaItems: [],
};

export default function CreateEventDialog({ open, onClose, prefillLeadId }) {
  const dispatch = useDispatch();
  const { users } = useSelector((s) => s.users);
  const { leads } = useSelector((s) => s.leads);

  const [form, setForm] = useState({ ...empty });
  const [agendaInput, setAgendaInput] = useState('');
  const [participantForm, setParticipantForm] = useState({ name: '', email: '', role: 'CLIENT' });
  const [submitting, setSubmitting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ configured: false, connected: false, loading: true });

  useEffect(() => {
    if (open) {
      dispatch(fetchUsers());
      if (!prefillLeadId) dispatch(fetchLeads({ page: 0, size: 100 }));
      // Check Google Calendar connection status
      axiosInstance.get(DEMOS.GOOGLE_STATUS)
        .then(r => setGoogleStatus({ ...r.data?.data, loading: false }))
        .catch(() => setGoogleStatus({ configured: false, connected: false, loading: false }));
    }
  }, [open, dispatch, prefillLeadId]);

  const handleConnectGoogle = () => {
    axiosInstance.get(DEMOS.GOOGLE_AUTH_URL).then(r => {
      const url = r.data?.data?.url;
      if (!url) { toast.error('Google Calendar not configured'); return; }
      const popup = window.open(url, 'google-oauth', 'width=500,height=600');
      const handler = (e) => {
        if (e.data === 'google-calendar-connected') {
          window.removeEventListener('message', handler);
          popup?.close();
          setGoogleStatus(s => ({ ...s, connected: true }));
          toast.success('Google Calendar connected!');
        }
      };
      window.addEventListener('message', handler);
    }).catch(() => toast.error('Could not get auth URL'));
  };

  useEffect(() => {
    if (open && prefillLeadId) {
      setForm(f => ({ ...f, leadId: prefillLeadId }));
    }
  }, [open, prefillLeadId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddAgenda = () => {
    const trimmed = agendaInput.trim();
    if (trimmed) {
      setForm({ ...form, agendaItems: [...form.agendaItems, trimmed] });
      setAgendaInput('');
    }
  };

  const handleRemoveAgenda = (idx) =>
    setForm({ ...form, agendaItems: form.agendaItems.filter((_, i) => i !== idx) });

  const handleAddParticipant = () => {
    if (participantForm.email || participantForm.name) {
      setForm({ ...form, participants: [...form.participants, { ...participantForm }] });
      setParticipantForm({ name: '', email: '', role: 'CLIENT' });
    }
  };

  const handleRemoveParticipant = (idx) =>
    setForm({ ...form, participants: form.participants.filter((_, i) => i !== idx) });

  const handleSave = async () => {
    if (!form.leadId) { toast.error('Select a lead'); return; }
    if (!form.title.trim()) { toast.error('Enter a title'); return; }
    if (!form.scheduledAt) { toast.error('Select a date and time'); return; }

    setSubmitting(true);
    const payload = {
      leadId: Number(form.leadId),
      title: form.title,
      scheduledAt: form.scheduledAt,
      durationMinutes: Number(form.durationMinutes),
      platform: form.platform,
      location: form.location || null,
      assignedTo: form.assignedTo || null,
      notes: form.notes || null,
      participants: form.participants,
      agendaItems: form.agendaItems,
    };

    const result = await dispatch(scheduleDemo(payload));
    setSubmitting(false);

    if (scheduleDemo.fulfilled.match(result)) {
      setForm({ ...empty });
      onClose();
      dispatch(openDemoDialog(result.payload));
    } else {
      toast.error(result.payload || 'Failed to schedule demo');
    }
  };

  const handleClose = () => {
    setForm({ ...empty });
    setAgendaInput('');
    onClose();
  };

  const selectedLead = leads.find(l => String(l.id) === String(form.leadId));

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>Schedule Demo</DialogTitle>

      <DialogContent sx={{ pt: '12px !important' }}>
        <Stack spacing={2}>
          {/* Google Calendar status banner */}
          {!googleStatus.loading && googleStatus.configured && form.platform === 'GOOGLE_MEET' && (
            googleStatus.connected ? (
              <Alert severity="success" sx={{ fontSize: 12, py: 0.5 }}>
                Google Calendar connected — a Meet link will be generated automatically.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ fontSize: 12, py: 0.5 }}
                action={
                  <Button size="small" onClick={handleConnectGoogle}
                    startIcon={<LinkOutlined sx={{ fontSize: 14 }} />}
                    sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    Connect
                  </Button>
                }>
                Connect Google Calendar to auto-generate a Meet link.
              </Alert>
            )
          )}

          {/* Lead */}
          {!prefillLeadId ? (
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: 13 }}>Lead / Company *</InputLabel>
              <Select
                label="Lead / Company *"
                name="leadId"
                value={form.leadId}
                onChange={handleChange}
                sx={{ fontSize: 13 }}
              >
                {leads.map(l => (
                  <MenuItem key={l.id} value={l.id} sx={{ fontSize: 13 }}>
                    {l.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            selectedLead && (
              <Box sx={{ px: 1, py: 0.5, background: '#F7F6F3', borderRadius: '8px' }}>
                <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>Lead</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedLead.companyName}</Typography>
              </Box>
            )
          )}

          {/* Title */}
          <TextField
            size="small" fullWidth label="Demo Title *"
            name="title" value={form.title} onChange={handleChange}
            inputProps={{ style: { fontSize: 13 } }}
          />

          {/* Date/time + duration */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small" fullWidth label="Date & Time *"
              type="datetime-local" name="scheduledAt"
              value={form.scheduledAt} onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ style: { fontSize: 13 } }}
            />
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: 13 }}>Duration</InputLabel>
              <Select
                label="Duration" name="durationMinutes"
                value={form.durationMinutes} onChange={handleChange}
                sx={{ fontSize: 13 }}
              >
                {DURATION_OPTIONS.map(d => (
                  <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>{d} min</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Platform */}
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: 13 }}>Platform</InputLabel>
            <Select
              label="Platform" name="platform"
              value={form.platform} onChange={handleChange}
              sx={{ fontSize: 13 }}
            >
              {PLATFORMS.map(p => (
                <MenuItem key={p.v} value={p.v} sx={{ fontSize: 13 }}>{p.l}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Location (shown for In Person / Other) */}
          {(form.platform === 'IN_PERSON' || form.platform === 'OTHER') && (
            <TextField
              size="small" fullWidth label="Location"
              name="location" value={form.location} onChange={handleChange}
              inputProps={{ style: { fontSize: 13 } }}
            />
          )}

          {/* Assigned to (demo presenter) */}
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: 13 }}>Demo Presenter</InputLabel>
            <Select
              label="Demo Presenter" name="assignedTo"
              value={form.assignedTo} onChange={handleChange}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>Unassigned</MenuItem>
              {users.map(u => (
                <MenuItem key={u.id} value={u.id} sx={{ fontSize: 13 }}>{u.name || u.email}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Notes */}
          <TextField
            size="small" fullWidth label="Notes"
            name="notes" value={form.notes} onChange={handleChange}
            multiline rows={2}
            inputProps={{ style: { fontSize: 13 } }}
          />

          {/* Participants */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#5A5A56', mb: 0.75 }}>
              Participants
            </Typography>
            {form.participants.map((p, i) => (
              <Chip
                key={i}
                label={`${p.name || p.email} (${p.role})`}
                size="small"
                onDelete={() => handleRemoveParticipant(i)}
                sx={{ mr: 0.5, mb: 0.5, fontSize: 11 }}
              />
            ))}
            <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
              <TextField
                size="small" placeholder="Name"
                value={participantForm.name}
                onChange={e => setParticipantForm({ ...participantForm, name: e.target.value })}
                sx={{ flex: 1 }} inputProps={{ style: { fontSize: 12 } }}
              />
              <TextField
                size="small" placeholder="Email"
                value={participantForm.email}
                onChange={e => setParticipantForm({ ...participantForm, email: e.target.value })}
                sx={{ flex: 1 }} inputProps={{ style: { fontSize: 12 } }}
              />
              <Select
                size="small" value={participantForm.role}
                onChange={e => setParticipantForm({ ...participantForm, role: e.target.value })}
                sx={{ fontSize: 12, minWidth: 90 }}
              >
                <MenuItem value="CLIENT" sx={{ fontSize: 12 }}>Client</MenuItem>
                <MenuItem value="INTERNAL" sx={{ fontSize: 12 }}>Internal</MenuItem>
              </Select>
              <IconButton size="small" onClick={handleAddParticipant}>
                <AddOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Agenda */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#5A5A56', mb: 0.75 }}>
              Agenda Items
            </Typography>
            {form.agendaItems.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Typography sx={{ fontSize: 12, flex: 1, color: '#1A1A18' }}>
                  {i + 1}. {item}
                </Typography>
                <IconButton size="small" onClick={() => handleRemoveAgenda(i)}>
                  <DeleteOutlined sx={{ fontSize: 15, color: '#A32D2D' }} />
                </IconButton>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <TextField
                size="small" fullWidth placeholder="Add agenda item"
                value={agendaInput}
                onChange={e => setAgendaInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAgenda(); } }}
                inputProps={{ style: { fontSize: 13 } }}
              />
              <Button size="small" variant="outlined" onClick={handleAddAgenda}
                sx={{ whiteSpace: 'nowrap', fontSize: 12, borderColor: '#E3E1DA', color: '#5A5A56' }}>
                Add
              </Button>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} color="inherit" sx={{ fontSize: 13 }}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSave} disabled={submitting}
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ fontSize: 13 }}
        >
          Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}
