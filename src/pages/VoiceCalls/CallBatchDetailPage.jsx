import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, LinearProgress,
  Chip, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, IconButton, Tooltip, CircularProgress, Alert,
} from '@mui/material';
import {
  ArrowBackOutlined, PauseOutlined, PlayArrowOutlined, CancelOutlined,
  RefreshOutlined, PlayCircleOutlined,
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import { CALLS } from '../../api/endpoints';
import PageWrapper from '../../components/common/PageWrapper';
import { formatDateTime } from '../../utils/formatDate';

/* ─── Status / outcome metadata ────────────────────────────────────────────── */
const BATCH_STATUS_META = {
  DRAFT:       { label: 'Draft',       bg: '#F0EEE9', text: '#5A5A56' },
  SCHEDULED:   { label: 'Scheduled',   bg: '#E6F1FB', text: '#185FA5' },
  IN_PROGRESS: { label: 'In Progress', bg: '#FAEEDA', text: '#BA7517' },
  COMPLETED:   { label: 'Completed',   bg: '#EAF3DE', text: '#3B6D11' },
  PAUSED:      { label: 'Paused',      bg: '#EEEDFE', text: '#534AB7' },
  CANCELLED:   { label: 'Cancelled',   bg: '#FCEBEB', text: '#A32D2D' },
};

const OUTCOME_META = {
  INTERESTED:     { label: 'Interested',     bg: '#E1F5EE', text: '#0F6E56' },
  NOT_INTERESTED: { label: 'Not Interested', bg: '#FCEBEB', text: '#A32D2D' },
  NO_ANSWER:      { label: 'No Answer',      bg: '#F0EEE9', text: '#5A5A56' },
  BUSY:           { label: 'Busy',           bg: '#FAEEDA', text: '#BA7517' },
  VOICEMAIL:      { label: 'Voicemail',      bg: '#EEEDFE', text: '#534AB7' },
  FAILED:         { label: 'Failed',         bg: '#FCEBEB', text: '#A32D2D' },
};

const LEAD_STATUS_META = {
  PENDING:     { label: 'Pending',     bg: '#EEEDFE', text: '#534AB7' },
  IN_PROGRESS: { label: 'In Progress', bg: '#FAEEDA', text: '#BA7517' },
  COMPLETED:   { label: 'Completed',   bg: '#EAF3DE', text: '#3B6D11' },
  SKIPPED:     { label: 'Skipped',     bg: '#F0EEE9', text: '#5A5A56' },
};

function StatusBadge({ value, meta }) {
  const m = meta[value] || { label: value || '—', bg: '#F0EEE9', text: '#5A5A56' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 999,
      padding: '2px 9px', fontSize: 10, fontWeight: 600,
      background: m.bg, color: m.text, whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
}

const HEADER_SX = {
  fontSize: 10, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.06em', whiteSpace: 'nowrap', background: '#F7F6F3',
};

export default function CallBatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch]   = useState(null);
  const [stats, setStats]   = useState(null);
  const [leads, setLeads]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]   = useState(null);

  // Playback state for recordings
  const [playingUrl, setPlayingUrl] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      axiosInstance.get(CALLS.BATCH(id)),
      axiosInstance.get(CALLS.BATCH_STATS(id)),
      axiosInstance.get(CALLS.BATCH_LEADS(id), { params: { size: 100 } }),
    ])
      .then(([batchRes, statsRes, leadsRes]) => {
        setBatch(batchRes.data?.data);
        setStats(statsRes.data?.data);
        const d = leadsRes.data?.data;
        setLeads(Array.isArray(d) ? d : d?.content || []);
        setError(null);
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load batch'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'pause')    await axiosInstance.post(CALLS.PAUSE(id));
      if (action === 'resume')   await axiosInstance.post(CALLS.RESUME(id));
      if (action === 'cancel')   await axiosInstance.post(CALLS.CANCEL(id));
      load();
    } catch { /* silent */ }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <PageWrapper title="Call Batch">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      </PageWrapper>
    );
  }

  if (!batch) {
    return (
      <PageWrapper title="Call Batch">
        <Alert severity="error">Batch not found.</Alert>
      </PageWrapper>
    );
  }

  const statusMeta = BATCH_STATUS_META[batch.status] || BATCH_STATUS_META.DRAFT;
  const pct = stats?.completionPercent ?? 0;

  const statCards = [
    { label: 'Total Leads',    value: stats?.total    ?? batch.totalLeads,     color: '#185FA5', bg: '#E6F1FB' },
    { label: 'Calls Made',     value: stats?.made     ?? batch.callsMade,      color: '#534AB7', bg: '#EEEDFE' },
    { label: 'Interested',     value: stats?.interested ?? batch.callsInterested, color: '#0F6E56', bg: '#E1F5EE' },
    { label: 'Not Interested', value: stats?.notInterested ?? batch.callsNotInterested, color: '#A32D2D', bg: '#FCEBEB' },
    { label: 'No Answer',      value: stats?.noAnswer ?? batch.callsNoAnswer,  color: '#5A5A56', bg: '#F0EEE9' },
    { label: 'Busy',           value: stats?.busy     ?? batch.callsBusy,      color: '#BA7517', bg: '#FAEEDA' },
  ];

  return (
    <PageWrapper title={batch.batchName}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <Button
          startIcon={<ArrowBackOutlined sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/calls')}
          size="small"
          sx={{ color: '#5A5A56', fontSize: 12, textTransform: 'none' }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1A1A18' }}>
            {batch.batchName}
          </Typography>
          <StatusBadge value={batch.status} meta={BATCH_STATUS_META} />
        </Box>

        {/* Action buttons */}
        {batch.status === 'IN_PROGRESS' && (
          <Button
            size="small" variant="outlined"
            startIcon={actionLoading ? <CircularProgress size={13} color="inherit" /> : <PauseOutlined sx={{ fontSize: 16 }} />}
            onClick={() => handleAction('pause')} disabled={actionLoading}
            sx={{ fontSize: 12, textTransform: 'none', borderColor: '#E3E1DA', color: '#BA7517' }}
          >
            Pause
          </Button>
        )}
        {batch.status === 'PAUSED' && (
          <Button
            size="small" variant="contained"
            startIcon={actionLoading ? <CircularProgress size={13} color="inherit" /> : <PlayArrowOutlined sx={{ fontSize: 16 }} />}
            onClick={() => handleAction('resume')} disabled={actionLoading}
            sx={{ fontSize: 12, textTransform: 'none' }}
          >
            Resume
          </Button>
        )}
        {(batch.status === 'IN_PROGRESS' || batch.status === 'PAUSED' || batch.status === 'SCHEDULED') && (
          <Button
            size="small" variant="outlined"
            startIcon={<CancelOutlined sx={{ fontSize: 16 }} />}
            onClick={() => handleAction('cancel')} disabled={actionLoading}
            sx={{ fontSize: 12, textTransform: 'none', borderColor: '#E3E1DA', color: '#A32D2D' }}
          >
            Cancel
          </Button>
        )}
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={load} sx={{ border: '1px solid #E3E1DA', borderRadius: '8px', p: 0.75 }}>
            <RefreshOutlined sx={{ fontSize: 16, color: '#5A5A56' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stat cards */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        {statCards.map(c => (
          <Card key={c.label} sx={{ flex: 1, minWidth: 110, border: '1px solid #E3E1DA', boxShadow: 'none', background: c.bg }}>
            <CardContent sx={{ p: '14px 16px !important' }}>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                {c.label}
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 300, fontFamily: 'DM Mono', color: c.color, lineHeight: 1 }}>
                {c.value ?? 0}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Progress */}
      <Card sx={{ mb: 2, border: '1px solid #E3E1DA', boxShadow: 'none' }}>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Completion</Typography>
            <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', color: '#5A5A56' }}>
              {stats?.made ?? 0} / {stats?.total ?? 0} &nbsp;·&nbsp; {pct.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate" value={Math.min(pct, 100)}
            sx={{ height: 8, borderRadius: 4, background: '#F0EEE9',
              '& .MuiLinearProgress-bar': { background: '#185FA5', borderRadius: 4 } }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>
              Answer rate: <b>{(stats?.answerRate ?? 0).toFixed(1)}%</b>
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#0F6E56' }}>
              Interested rate: <b>{(stats?.interestedRate ?? 0).toFixed(1)}%</b>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Batch config summary */}
      <Card sx={{ mb: 2, border: '1px solid #E3E1DA', boxShadow: 'none' }}>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
            Configuration
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Language',      value: batch.language },
              { label: 'Mode',          value: batch.callingMode },
              { label: 'Max Retries',   value: batch.retryMaxAttempts },
              { label: 'Retry Interval',value: `${batch.retryIntervalMinutes} min` },
              { label: 'Biz Hours',     value: `${batch.businessHoursStart} – ${batch.businessHoursEnd}` },
              { label: 'Respect DND',   value: batch.respectDnd ? 'Yes' : 'No' },
            ].map(item => (
              <Box key={item.label}>
                <Typography sx={{ fontSize: 10, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18' }}>
                  {item.value ?? '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Leads table */}
      <Card sx={{ border: '1px solid #E3E1DA', boxShadow: 'none' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F0EEE9' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18' }}>
            Leads ({leads.length})
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Company', 'Contact', 'Phone', 'Status', 'Attempts', 'Outcome', 'Recording'].map(h => (
                  <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#5A5A56', fontSize: 13 }}>
                    No leads in this batch
                  </TableCell>
                </TableRow>
              ) : leads.map(row => (
                <TableRow key={row.id} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                  <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{row.companyName || '—'}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{row.contactName || '—'}</TableCell>
                  <TableCell sx={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#5A5A56' }}>
                    {row.phoneNumber || '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} meta={LEAD_STATUS_META} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, fontFamily: 'DM Mono' }}>
                    {row.attemptCount ?? 0}
                  </TableCell>
                  <TableCell>
                    {row.lastOutcome
                      ? <StatusBadge value={row.lastOutcome} meta={OUTCOME_META} />
                      : <span style={{ color: '#CBCAC6', fontSize: 12 }}>—</span>}
                  </TableCell>
                  <TableCell>
                    {row.recordingUrl ? (
                      playingUrl === row.recordingUrl ? (
                        <Box>
                          <audio
                            autoPlay controls src={row.recordingUrl}
                            style={{ height: 28, width: 180 }}
                            onEnded={() => setPlayingUrl(null)}
                          />
                        </Box>
                      ) : (
                        <Tooltip title="Play recording">
                          <IconButton size="small" onClick={() => setPlayingUrl(row.recordingUrl)}>
                            <PlayCircleOutlined sx={{ fontSize: 18, color: '#185FA5' }} />
                          </IconButton>
                        </Tooltip>
                      )
                    ) : (
                      <span style={{ color: '#CBCAC6', fontSize: 12 }}>—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </PageWrapper>
  );
}
