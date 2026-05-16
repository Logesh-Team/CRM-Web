import React, { useState, useEffect } from 'react';
import {
  Drawer, Stack, Typography, Divider, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Chip, IconButton, Link, Tooltip,
} from '@mui/material';
import {
  EditOutlined, CancelOutlined, CheckCircleOutlined,
  PersonOffOutlined, OpenInNewOutlined,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeDemoDialog, updateDemo, cancelDemo, postDemo, markNoShow,
} from '../features/demos/demosSlice';
import { fetchUsers } from '../features/users/usersSlice';
import toast from 'react-hot-toast';
import { formatDateTime } from '../utils/formatDate';

const PLATFORM_LABELS = {
  GOOGLE_MEET: 'Google Meet', ZOOM: 'Zoom',
  IN_PERSON: 'In Person', OTHER: 'Other',
};
const STATUS_COLORS = {
  SCHEDULED: { bg: '#E6F1FB', text: '#185FA5' },
  COMPLETED:  { bg: '#EAF3DE', text: '#3B6D11' },
  CANCELLED:  { bg: '#FCEBEB', text: '#A32D2D' },
  NO_SHOW:    { bg: '#FAEEDA', text: '#BA7517' },
};

function DetailRow({ label, value, link }) {
  if (!value) return null;
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      {link ? (
        <Link href={value} target="_blank" rel="noopener noreferrer"
          sx={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {value} <OpenInNewOutlined sx={{ fontSize: 12 }} />
        </Link>
      ) : (
        <Typography sx={{ fontSize: 13, color: '#1A1A18', wordBreak: 'break-word' }}>{value}</Typography>
      )}
    </Stack>
  );
}

function StatusChip({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, background: c.bg, color: c.text,
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function EventDialog() {
  const dispatch = useDispatch();
  const { dialogOpen, selectedDemo } = useSelector(s => s.demos);
  const { users } = useSelector(s => s.users);

  const [mode, setMode] = useState('view'); // view | edit | post-demo | cancel
  const [editForm, setEditForm] = useState({});
  const [postForm, setPostForm] = useState({ outcome: '', postDemoNotes: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (dialogOpen) dispatch(fetchUsers());
  }, [dialogOpen, dispatch]);

  useEffect(() => {
    if (selectedDemo) {
      setEditForm({
        title: selectedDemo.title || '',
        scheduledAt: selectedDemo.scheduledAt ? selectedDemo.scheduledAt.substring(0, 16) : '',
        durationMinutes: selectedDemo.durationMinutes || 60,
        platform: selectedDemo.platform || 'GOOGLE_MEET',
        location: selectedDemo.location || '',
        assignedTo: selectedDemo.assignedTo || '',
        notes: selectedDemo.notes || '',
      });
      setMode('view');
    }
  }, [selectedDemo]);

  const close = () => {
    dispatch(closeDemoDialog());
    setMode('view');
    setCancelReason('');
    setPostForm({ outcome: '', postDemoNotes: '' });
  };

  const handleSaveEdit = async () => {
    setSubmitting(true);
    const result = await dispatch(updateDemo({
      id: selectedDemo.id,
      data: {
        ...editForm,
        durationMinutes: Number(editForm.durationMinutes),
        assignedTo: editForm.assignedTo || null,
      },
    }));
    setSubmitting(false);
    if (updateDemo.fulfilled.match(result)) {
      toast.success('Demo updated');
      setMode('view');
    } else {
      toast.error(result.payload || 'Update failed');
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    const result = await dispatch(cancelDemo({ id: selectedDemo.id, reason: cancelReason }));
    setSubmitting(false);
    if (cancelDemo.fulfilled.match(result)) {
      toast.success('Demo cancelled');
      close();
    } else {
      toast.error(result.payload || 'Cancel failed');
    }
  };

  const handlePostDemo = async () => {
    setSubmitting(true);
    const result = await dispatch(postDemo({ id: selectedDemo.id, data: postForm }));
    setSubmitting(false);
    if (postDemo.fulfilled.match(result)) {
      toast.success('Post-demo recorded');
      close();
    } else {
      toast.error(result.payload || 'Failed');
    }
  };

  const handleNoShow = async () => {
    setSubmitting(true);
    const result = await dispatch(markNoShow(selectedDemo.id));
    setSubmitting(false);
    if (markNoShow.fulfilled.match(result)) {
      toast.success('Marked as no-show');
      close();
    } else {
      toast.error(result.payload || 'Failed');
    }
  };

  if (!selectedDemo) return null;

  const isScheduled = selectedDemo.status === 'SCHEDULED';
  const canEdit = isScheduled;

  return (
    <Drawer anchor="right" open={dialogOpen} onClose={close}>
      <Stack spacing={0} sx={{ width: 420, height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #E3E1DA' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1A1A18', flex: 1, mr: 1 }}>
              {selectedDemo.title}
            </Typography>
            <StatusChip status={selectedDemo.status} />
          </Box>
          {selectedDemo.leadCompanyName && (
            <Typography sx={{ fontSize: 12, color: '#5A5A56', mt: 0.5 }}>
              {selectedDemo.leadCompanyName}
            </Typography>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {mode === 'view' && (
            <Stack spacing={2}>
              <DetailRow label="Scheduled" value={formatDateTime(selectedDemo.scheduledAt)} />
              <DetailRow label="Duration" value={`${selectedDemo.durationMinutes} minutes`} />
              <DetailRow label="Platform" value={PLATFORM_LABELS[selectedDemo.platform] || selectedDemo.platform} />
              {selectedDemo.meetLink && (
                <DetailRow label="Meet Link" value={selectedDemo.meetLink} link />
              )}
              {selectedDemo.location && (
                <DetailRow label="Location" value={selectedDemo.location} />
              )}
              <Divider />
              <DetailRow label="Demo Presenter" value={selectedDemo.assignedToName || '—'} />
              <DetailRow label="Scheduled By" value={selectedDemo.scheduledByName} />
              {selectedDemo.notes && <DetailRow label="Notes" value={selectedDemo.notes} />}

              {/* Participants */}
              {selectedDemo.participants?.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Participants
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedDemo.participants.map((p, i) => (
                      <Chip key={i} size="small" label={p.name || p.email}
                        sx={{ fontSize: 11 }} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Agenda */}
              {selectedDemo.agendaItems?.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Agenda
                  </Typography>
                  {selectedDemo.agendaItems.map((a, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                      <Box sx={{
                        width: 16, height: 16, borderRadius: 2, border: '1.5px solid',
                        borderColor: a.done ? '#3B6D11' : '#E3E1DA',
                        background: a.done ? '#3B6D11' : 'transparent',
                        flexShrink: 0,
                      }} />
                      <Typography sx={{ fontSize: 12, color: a.done ? '#5A5A56' : '#1A1A18',
                        textDecoration: a.done ? 'line-through' : 'none' }}>
                        {a.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Post-demo data */}
              {selectedDemo.outcome && (
                <>
                  <Divider />
                  <DetailRow label="Outcome" value={selectedDemo.outcome} />
                  {selectedDemo.postDemoNotes && (
                    <DetailRow label="Post-Demo Notes" value={selectedDemo.postDemoNotes} />
                  )}
                </>
              )}
            </Stack>
          )}

          {mode === 'edit' && (
            <Stack spacing={2}>
              <TextField size="small" fullWidth label="Title"
                value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                inputProps={{ style: { fontSize: 13 } }} />
              <TextField size="small" fullWidth label="Date & Time"
                type="datetime-local" InputLabelProps={{ shrink: true }}
                value={editForm.scheduledAt}
                onChange={e => setEditForm({...editForm, scheduledAt: e.target.value})}
                inputProps={{ style: { fontSize: 13 } }} />
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>Duration (min)</InputLabel>
                <Select label="Duration (min)" value={editForm.durationMinutes}
                  onChange={e => setEditForm({...editForm, durationMinutes: e.target.value})}
                  sx={{ fontSize: 13 }}>
                  {[30,45,60,90,120].map(d => <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>{d} min</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>Platform</InputLabel>
                <Select label="Platform" value={editForm.platform}
                  onChange={e => setEditForm({...editForm, platform: e.target.value})}
                  sx={{ fontSize: 13 }}>
                  {[['GOOGLE_MEET','Google Meet'],['ZOOM','Zoom'],['IN_PERSON','In Person'],['OTHER','Other']].map(([v,l]) =>
                    <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{l}</MenuItem>)}
                </Select>
              </FormControl>
              {(editForm.platform === 'IN_PERSON' || editForm.platform === 'OTHER') && (
                <TextField size="small" fullWidth label="Location"
                  value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})}
                  inputProps={{ style: { fontSize: 13 } }} />
              )}
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>Demo Presenter</InputLabel>
                <Select label="Demo Presenter" value={editForm.assignedTo}
                  onChange={e => setEditForm({...editForm, assignedTo: e.target.value})}
                  sx={{ fontSize: 13 }}>
                  <MenuItem value="" sx={{ fontSize: 13 }}>Unassigned</MenuItem>
                  {users.map(u => <MenuItem key={u.id} value={u.id} sx={{ fontSize: 13 }}>{u.name || u.email}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" fullWidth label="Notes" multiline rows={2}
                value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})}
                inputProps={{ style: { fontSize: 13 } }} />
            </Stack>
          )}

          {mode === 'post-demo' && (
            <Stack spacing={2}>
              <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>
                Record the outcome of this demo.
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>Outcome</InputLabel>
                <Select label="Outcome" value={postForm.outcome}
                  onChange={e => setPostForm({...postForm, outcome: e.target.value})}
                  sx={{ fontSize: 13 }}>
                  <MenuItem value="INTERESTED" sx={{ fontSize: 13 }}>Interested — proceeding</MenuItem>
                  <MenuItem value="QUOTATION_REQUESTED" sx={{ fontSize: 13 }}>Quotation Requested</MenuItem>
                  <MenuItem value="FOLLOW_UP" sx={{ fontSize: 13 }}>Needs Follow-up</MenuItem>
                  <MenuItem value="NOT_INTERESTED" sx={{ fontSize: 13 }}>Not Interested</MenuItem>
                </Select>
              </FormControl>
              <TextField size="small" fullWidth label="Post-Demo Notes" multiline rows={4}
                value={postForm.postDemoNotes}
                onChange={e => setPostForm({...postForm, postDemoNotes: e.target.value})}
                inputProps={{ style: { fontSize: 13 } }} />
            </Stack>
          )}

          {mode === 'cancel' && (
            <Stack spacing={2}>
              <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>
                Provide a reason for cancellation (optional).
              </Typography>
              <TextField size="small" fullWidth label="Reason" multiline rows={3}
                value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                inputProps={{ style: { fontSize: 13 } }} />
            </Stack>
          )}
        </Box>

        {/* Footer actions */}
        <Box sx={{ p: 2.5, borderTop: '1px solid #E3E1DA' }}>
          {mode === 'view' && (
            <Stack spacing={1}>
              {isScheduled && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" startIcon={<EditOutlined />}
                    onClick={() => setMode('edit')}
                    sx={{ flex: 1, fontSize: 12, borderColor: '#E3E1DA', color: '#5A5A56' }}>
                    Edit
                  </Button>
                  <Button size="small" variant="contained" startIcon={<CheckCircleOutlined />}
                    onClick={() => setMode('post-demo')}
                    sx={{ flex: 1, fontSize: 12, background: '#3B6D11' }}>
                    Mark Done
                  </Button>
                </Box>
              )}
              {isScheduled && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" startIcon={<PersonOffOutlined />}
                    onClick={handleNoShow} disabled={submitting}
                    sx={{ flex: 1, fontSize: 12, borderColor: '#BA7517', color: '#BA7517' }}>
                    No Show
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<CancelOutlined />}
                    onClick={() => setMode('cancel')}
                    sx={{ flex: 1, fontSize: 12, borderColor: '#A32D2D', color: '#A32D2D' }}>
                    Cancel
                  </Button>
                </Box>
              )}
              <Button size="small" onClick={close}
                sx={{ fontSize: 12, color: '#5A5A56' }}>
                Close
              </Button>
            </Stack>
          )}

          {mode === 'edit' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setMode('view')} color="inherit" size="small"
                sx={{ flex: 1, fontSize: 12 }}>
                Cancel
              </Button>
              <Button variant="contained" size="small" onClick={handleSaveEdit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={13} color="inherit" /> : null}
                sx={{ flex: 1, fontSize: 12 }}>
                Save
              </Button>
            </Box>
          )}

          {mode === 'post-demo' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setMode('view')} color="inherit" size="small"
                sx={{ flex: 1, fontSize: 12 }}>
                Back
              </Button>
              <Button variant="contained" size="small" onClick={handlePostDemo}
                disabled={submitting || !postForm.outcome}
                startIcon={submitting ? <CircularProgress size={13} color="inherit" /> : null}
                sx={{ flex: 1, fontSize: 12 }}>
                Save Outcome
              </Button>
            </Box>
          )}

          {mode === 'cancel' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setMode('view')} color="inherit" size="small"
                sx={{ flex: 1, fontSize: 12 }}>
                Back
              </Button>
              <Button variant="contained" size="small" onClick={handleCancel}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={13} color="inherit" /> : null}
                sx={{ flex: 1, fontSize: 12, background: '#A32D2D', '&:hover': { background: '#8B2020' } }}>
                Confirm Cancel
              </Button>
            </Box>
          )}
        </Box>
      </Stack>
    </Drawer>
  );
}
