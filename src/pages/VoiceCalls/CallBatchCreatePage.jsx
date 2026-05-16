import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField, Select,
  MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Divider, CircularProgress, Chip, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Alert,
} from '@mui/material';
import {
  ArrowBackOutlined, SearchOutlined, AddOutlined,
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import { CALLS } from '../../api/endpoints';
import PageWrapper from '../../components/common/PageWrapper';

const SECTION = { mb: 3 };
const LABEL = { fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 };
const FIELD_SX = { '& .MuiInputBase-root': { fontSize: 13 }, '& .MuiInputLabel-root': { fontSize: 13 } };

const LANGUAGES   = ['ENGLISH', 'TAMIL', 'HINDI'];
const MODES       = ['SEQUENTIAL', 'PARALLEL'];
const SCHEDULE    = ['IMMEDIATE', 'SCHEDULED'];
const LEAD_STAGES = ['NEW', 'AI_CALL_SCHEDULED', 'IN_FOLLOW_UP', 'DEMO_SCHEDULED', 'DEMO_DONE', 'QUOTATION_SENT', 'NEGOTIATION'];

export default function CallBatchCreatePage() {
  const navigate = useNavigate();

  // Basic
  const [batchName, setBatchName]         = useState('');
  const [language, setLanguage]           = useState('ENGLISH');
  const [scheduleType, setScheduleType]   = useState('IMMEDIATE');
  const [scheduledAt, setScheduledAt]     = useState('');

  // Calling config
  const [callingMode, setCallingMode]     = useState('SEQUENTIAL');
  const [maxParallel, setMaxParallel]     = useState(5);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [retryInterval, setRetryInterval] = useState(30);
  const [bizStart, setBizStart]           = useState('09:00');
  const [bizEnd, setBizEnd]               = useState('19:00');
  const [respectDnd, setRespectDnd]       = useState(true);

  // Lead filter / preview
  const [filterIndustry, setFilterIndustry]   = useState('');
  const [filterLocation, setFilterLocation]   = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterStages, setFilterStages]       = useState([]);
  const [previewData, setPreviewData]         = useState(null);
  const [previewLoading, setPreviewLoading]   = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Submit
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);

  const handlePreview = () => {
    setPreviewLoading(true);
    axiosInstance
      .post(CALLS.PREVIEW_LEADS, {
        industry: filterIndustry || undefined,
        location: filterLocation || undefined,
        assignedTo: filterAssignedTo || undefined,
        stages: filterStages.length ? filterStages : undefined,
      })
      .then(r => {
        const d = r.data?.data;
        setPreviewData(d);
        setSelectedLeadIds(d?.leads?.map(l => l.id) || []);
      })
      .catch(() => setPreviewData(null))
      .finally(() => setPreviewLoading(false));
  };

  const toggleLead = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!batchName.trim()) { setError('Batch name is required.'); return; }
    if (selectedLeadIds.length === 0) { setError('Select at least one lead.'); return; }
    setError(null);
    setSubmitting(true);
    axiosInstance
      .post(CALLS.BATCHES, {
        batchName,
        leadIds: selectedLeadIds,
        scheduleType,
        scheduledAt: scheduledAt || undefined,
        callingMode,
        maxParallelCalls: callingMode === 'PARALLEL' ? maxParallel : undefined,
        retryMaxAttempts: retryAttempts,
        retryIntervalMinutes: retryInterval,
        businessHoursStart: bizStart,
        businessHoursEnd: bizEnd,
        respectDnd,
        language,
      })
      .then(r => {
        const id = r.data?.data?.id;
        navigate(id ? `/calls/${id}` : '/calls');
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to create batch'))
      .finally(() => setSubmitting(false));
  };

  return (
    <PageWrapper title="New AI Call Batch">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Button
          startIcon={<ArrowBackOutlined sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/calls')}
          size="small"
          sx={{ color: '#5A5A56', fontSize: 12, textTransform: 'none' }}
        >
          Back
        </Button>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1A1A18' }}>
          New AI Call Batch
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left column — config */}
        <Box sx={{ flex: '1 1 380px', minWidth: 320 }}>

          {/* Basic */}
          <Card sx={{ border: '1px solid #E3E1DA', boxShadow: 'none', mb: 2 }}>
            <CardContent sx={{ p: '20px 24px !important' }}>
              <Typography sx={{ ...LABEL }}>Basic Info</Typography>
              <TextField
                fullWidth size="small" label="Batch Name" value={batchName}
                onChange={e => setBatchName(e.target.value)}
                sx={{ ...FIELD_SX, mb: 2 }}
              />
              <FormControl fullWidth size="small" sx={{ ...FIELD_SX, mb: 2 }}>
                <InputLabel>Language</InputLabel>
                <Select value={language} onChange={e => setLanguage(e.target.value)} label="Language">
                  {LANGUAGES.map(l => (
                    <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>{l}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ ...FIELD_SX, mb: 2 }}>
                <InputLabel>Schedule</InputLabel>
                <Select value={scheduleType} onChange={e => setScheduleType(e.target.value)} label="Schedule">
                  {SCHEDULE.map(s => (
                    <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {scheduleType === 'SCHEDULED' && (
                <TextField
                  fullWidth size="small" label="Scheduled At" type="datetime-local"
                  value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ ...FIELD_SX }}
                />
              )}
            </CardContent>
          </Card>

          {/* Calling config */}
          <Card sx={{ border: '1px solid #E3E1DA', boxShadow: 'none', mb: 2 }}>
            <CardContent sx={{ p: '20px 24px !important' }}>
              <Typography sx={{ ...LABEL }}>Calling Config</Typography>
              <FormControl fullWidth size="small" sx={{ ...FIELD_SX, mb: 2 }}>
                <InputLabel>Calling Mode</InputLabel>
                <Select value={callingMode} onChange={e => setCallingMode(e.target.value)} label="Calling Mode">
                  {MODES.map(m => (
                    <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {callingMode === 'PARALLEL' && (
                <TextField
                  fullWidth size="small" label="Max Parallel Calls" type="number"
                  value={maxParallel} onChange={e => setMaxParallel(Number(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 20 }} sx={{ ...FIELD_SX, mb: 2 }}
                />
              )}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <TextField
                  size="small" label="Max Retries" type="number" value={retryAttempts}
                  onChange={e => setRetryAttempts(Number(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 5 }} sx={{ ...FIELD_SX, flex: 1 }}
                />
                <TextField
                  size="small" label="Retry Interval (min)" type="number" value={retryInterval}
                  onChange={e => setRetryInterval(Number(e.target.value) || 15)}
                  inputProps={{ min: 15 }} sx={{ ...FIELD_SX, flex: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <TextField
                  size="small" label="Business Hours Start" type="time" value={bizStart}
                  onChange={e => setBizStart(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ ...FIELD_SX, flex: 1 }}
                />
                <TextField
                  size="small" label="Business Hours End" type="time" value={bizEnd}
                  onChange={e => setBizEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ ...FIELD_SX, flex: 1 }}
                />
              </Box>
              <FormControlLabel
                control={<Switch checked={respectDnd} onChange={e => setRespectDnd(e.target.checked)} size="small" />}
                label={<Typography sx={{ fontSize: 13 }}>Respect DND numbers</Typography>}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Right column — lead selection */}
        <Box sx={{ flex: '2 1 480px', minWidth: 360 }}>
          <Card sx={{ border: '1px solid #E3E1DA', boxShadow: 'none' }}>
            <CardContent sx={{ p: '20px 24px !important' }}>
              <Typography sx={{ ...LABEL }}>Lead Filter &amp; Selection</Typography>

              {/* Filters */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                <TextField size="small" label="Industry" value={filterIndustry}
                  onChange={e => setFilterIndustry(e.target.value)}
                  sx={{ ...FIELD_SX, minWidth: 130, flex: 1 }} />
                <TextField size="small" label="City / Location" value={filterLocation}
                  onChange={e => setFilterLocation(e.target.value)}
                  sx={{ ...FIELD_SX, minWidth: 130, flex: 1 }} />
                <TextField size="small" label="Assigned To" value={filterAssignedTo}
                  onChange={e => setFilterAssignedTo(e.target.value)}
                  sx={{ ...FIELD_SX, minWidth: 160, flex: 1 }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: '#5A5A56', mb: 0.75 }}>Lead Stage</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {LEAD_STAGES.map(s => (
                    <Chip
                      key={s}
                      label={s.replace(/_/g, ' ')}
                      size="small"
                      onClick={() => setFilterStages(prev =>
                        prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                      )}
                      sx={{
                        fontSize: 10, height: 22,
                        background: filterStages.includes(s) ? '#185FA5' : '#F0EEE9',
                        color: filterStages.includes(s) ? '#fff' : '#5A5A56',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={previewLoading
                  ? <CircularProgress size={13} color="inherit" />
                  : <SearchOutlined sx={{ fontSize: 15 }} />}
                onClick={handlePreview}
                disabled={previewLoading}
                size="small"
                sx={{ fontSize: 12, textTransform: 'none', borderColor: '#E3E1DA', color: '#185FA5', mb: 2 }}
              >
                Preview Leads
              </Button>

              {previewData && (
                <>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {previewData.count} leads found &nbsp;·&nbsp;
                      <span style={{ color: '#185FA5' }}>{selectedLeadIds.length} selected</span>
                    </Typography>
                    <Button size="small" sx={{ fontSize: 11, textTransform: 'none' }}
                      onClick={() => {
                        const allIds = previewData.leads.map(l => l.id);
                        setSelectedLeadIds(
                          selectedLeadIds.length === allIds.length ? [] : allIds
                        );
                      }}>
                      {selectedLeadIds.length === previewData.leads.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </Box>
                  <TableContainer sx={{ maxHeight: 340, border: '1px solid #F0EEE9', borderRadius: '8px' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ background: '#F7F6F3' }}>
                          {['', 'Name', 'Phone', 'Grade', 'Stage'].map(h => (
                            <TableCell key={h} sx={{ fontSize: 10, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase', background: '#F7F6F3' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.leads.map(lead => (
                          <TableRow
                            key={lead.id}
                            onClick={() => toggleLead(lead.id)}
                            sx={{ cursor: 'pointer', '&:hover': { background: '#F7F6F3' },
                              background: selectedLeadIds.includes(lead.id) ? '#EEF4FC' : 'transparent' }}
                          >
                            <TableCell sx={{ width: 32, pl: 1.5 }}>
                              <input type="checkbox" readOnly
                                checked={selectedLeadIds.includes(lead.id)}
                                style={{ cursor: 'pointer' }} />
                            </TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{lead.name || '—'}</TableCell>
                            <TableCell sx={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#5A5A56' }}>{lead.phone || '—'}</TableCell>
                            <TableCell sx={{ fontSize: 12, color: '#534AB7', fontWeight: 600 }}>{lead.grade || '—'}</TableCell>
                            <TableCell sx={{ fontSize: 11 }}>{lead.stage ? lead.stage.replace(/_/g, ' ') : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Action bar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
        <Button onClick={() => navigate('/calls')} sx={{ fontSize: 13, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <AddOutlined sx={{ fontSize: 16 }} />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ fontSize: 13, textTransform: 'none', minWidth: 160 }}
        >
          {scheduleType === 'SCHEDULED' ? 'Schedule Batch' : 'Start Batch Now'}
        </Button>
      </Box>
    </PageWrapper>
  );
}
