import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Select, MenuItem,
  FormControl, InputLabel, InputBase, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, IconButton, Tooltip,
  LinearProgress, CircularProgress,
} from '@mui/material';
import {
  PauseOutlined, PlayArrowOutlined, PhoneOutlined, VisibilityOutlined,
  SearchOutlined, RefreshOutlined, PeopleOutlined, CheckCircleOutlined,
  CancelOutlined, PhoneMissedOutlined, WarningAmberOutlined,
  ArrowUpwardOutlined, ArrowDownwardOutlined, UnfoldMoreOutlined, AddOutlined,
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';
import { CALLS } from '../api/endpoints';
import PageWrapper from '../components/common/PageWrapper';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import { formatDateTime } from '../utils/formatDate';

/* ─── Outcome metadata ─────────────────────────────────────────────────────── */
const OUTCOME_META = {
  INTERESTED:     { label: 'Interested',     bg: '#E1F5EE', text: '#0F6E56', border: '#A5DFD0' },
  NOT_INTERESTED: { label: 'Not Interested', bg: '#FCEBEB', text: '#A32D2D', border: '#F0B8B8' },
  NO_ANSWER:      { label: 'No Answer',      bg: '#F0EEE9', text: '#5A5A56', border: '#E3E1DA' },
  BUSY:           { label: 'Busy',           bg: '#FAEEDA', text: '#BA7517', border: '#F0D09A' },
  PENDING:        { label: 'Pending',        bg: '#EEEDFE', text: '#534AB7', border: '#C5C2F5' },
};

const CAMPAIGN_STATUS_META = {
  LIVE:        { label: 'Live',        bg: '#E1F5EE', text: '#0F6E56' },
  PAUSED:      { label: 'Paused',      bg: '#FAEEDA', text: '#BA7517' },
  COMPLETED:   { label: 'Completed',   bg: '#F0EEE9', text: '#5A5A56' },
  IN_PROGRESS: { label: 'In Progress', bg: '#FAEEDA', text: '#BA7517' },
  SCHEDULED:   { label: 'Scheduled',   bg: '#E6F1FB', text: '#185FA5' },
  CANCELLED:   { label: 'Cancelled',   bg: '#FCEBEB', text: '#A32D2D' },
  DRAFT:       { label: 'Draft',       bg: '#F0EEE9', text: '#5A5A56' },
};

/* ─── Small reusable components ────────────────────────────────────────────── */
function OutcomeBadge({ outcome }) {
  const meta = OUTCOME_META[outcome] || OUTCOME_META.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 999,
      padding: '2px 9px', fontSize: 10, fontWeight: 600,
      background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`,
      whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif',
    }}>
      {meta.label}
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, color, subLabel }) {
  return (
    <Card sx={{ flex: 1, minWidth: 130, border: '1px solid #E3E1DA', boxShadow: 'none' }}>
      <CardContent sx={{ p: '14px 18px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.25 }}>
          <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {label}
          </Typography>
          <Box sx={{ width: 26, height: 26, borderRadius: '7px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ fontSize: 14, color }} />
          </Box>
        </Box>
        <Typography sx={{ fontSize: 24, fontWeight: 300, fontFamily: 'DM Mono', color: '#1A1A18', lineHeight: 1 }}>
          {value ?? '—'}
        </Typography>
        {subLabel && (
          <Typography sx={{ fontSize: 10, color: '#5A5A56', mt: 0.5 }}>{subLabel}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (field !== sortField) return <UnfoldMoreOutlined sx={{ fontSize: 12, color: '#CBCAC6', ml: 0.5, flexShrink: 0 }} />;
  return sortDir === 'asc'
    ? <ArrowUpwardOutlined sx={{ fontSize: 12, color: '#185FA5', ml: 0.5, flexShrink: 0 }} />
    : <ArrowDownwardOutlined sx={{ fontSize: 12, color: '#185FA5', ml: 0.5, flexShrink: 0 }} />;
}

/* ─── Table column definitions ─────────────────────────────────────────────── */
const COLS = [
  { field: 'name',        label: 'Lead Name', sortable: true,  width: undefined },
  { field: 'companyName', label: 'Company',   sortable: false, width: 160 },
  { field: 'phone',       label: 'Phone',     sortable: false, width: 130 },
  { field: 'calledAt',    label: 'Called At', sortable: true,  width: 160 },
  { field: 'attempts',    label: 'Attempts',  sortable: true,  width: 90 },
  { field: 'callOutcome', label: 'Outcome',   sortable: false, width: 130 },
  { field: '_actions',    label: '',          sortable: false, width: 48  },
];

const HEADER_CELL_SX = {
  fontSize: 10, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.06em', whiteSpace: 'nowrap', py: 1.25,
  background: '#F7F6F3', borderBottom: '1px solid #E3E1DA',
};

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function VoiceCallsPage() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns]               = useState([]);
  const [selectedId, setSelectedId]             = useState('');
  const [campaign, setCampaign]                 = useState(null);
  const [leads, setLeads]                       = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [leadsLoading, setLeadsLoading]         = useState(false);
  const [actionLoading, setActionLoading]       = useState(false);
  const [error, setError]                       = useState(null);

  const [search, setSearch]                     = useState('');
  const [outcomeFilter, setOutcomeFilter]       = useState('');
  const [sortField, setSortField]               = useState('calledAt');
  const [sortDir, setSortDir]                   = useState('desc');

  /* ── Data loaders ── */
  const loadCampaigns = useCallback(() => {
    axiosInstance.get(CALLS.CAMPAIGNS)
      .then((r) => {
        const data = r.data?.data;
        const list = Array.isArray(data) ? data : (data?.content || []);
        setCampaigns(list);
        if (list.length && !selectedId) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, [selectedId]);

  const loadCampaign = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    axiosInstance.get(CALLS.CAMPAIGN(selectedId))
      .then((r) => { setCampaign(r.data?.data ?? null); setError(null); })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load campaign'))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const loadLeads = useCallback(() => {
    if (!selectedId) return;
    setLeadsLoading(true);
    axiosInstance.get(CALLS.CAMPAIGN_LEADS(selectedId))
      .then((r) => {
        const data = r.data?.data;
        setLeads(Array.isArray(data) ? data : (data?.content || []));
      })
      .catch(() => {})
      .finally(() => setLeadsLoading(false));
  }, [selectedId]);

  useEffect(() => { loadCampaigns(); }, []); // eslint-disable-line
  useEffect(() => { loadCampaign(); loadLeads(); }, [selectedId]); // eslint-disable-line

  /* ── Pause / Resume ── */
  const handlePauseResume = async () => {
    if (!campaign || actionLoading) return;
    setActionLoading(true);
    const url = campaign.status === 'LIVE' ? CALLS.PAUSE(campaign.id) : CALLS.RESUME(campaign.id);
    try { await axiosInstance.patch(url); loadCampaign(); } catch { /* silent */ }
    setActionLoading(false);
  };

  /* ── Sorting ── */
  const handleSort = (field) => {
    setSortDir((d) => sortField === field ? (d === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortField(field);
  };

  /* ── Derived stats (prefer API summary values, fall back to client-computed) ── */
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const calledToday = campaign?.calledToday
      ?? leads.filter((l) => l.calledAt && new Date(l.calledAt).toDateString() === today).length;
    const interested    = campaign?.interested    ?? leads.filter((l) => l.callOutcome === 'INTERESTED').length;
    const notInterested = campaign?.notInterested ?? leads.filter((l) => l.callOutcome === 'NOT_INTERESTED').length;
    const notAnswered   = campaign?.notAnswered   ?? leads.filter((l) => l.callOutcome === 'NO_ANSWER').length;
    const busy          = campaign?.busy          ?? leads.filter((l) => l.callOutcome === 'BUSY').length;
    const called        = interested + notInterested + notAnswered + busy;
    const total         = campaign?.totalLeads ?? leads.length;
    return { total, calledToday, interested, notInterested, notAnswered, busy, called };
  }, [campaign, leads]);

  const progressPct = stats.total > 0 ? Math.min(Math.round((stats.called / stats.total) * 100), 100) : 0;

  /* ── Outcome pills data ── */
  const pills = [
    { label: 'Interested',     count: stats.interested,    color: '#0F6E56', bg: '#E1F5EE' },
    { label: 'Not Interested', count: stats.notInterested, color: '#A32D2D', bg: '#FCEBEB' },
    { label: 'No Answer',      count: stats.notAnswered,   color: '#5A5A56', bg: '#F0EEE9' },
    { label: 'Busy',           count: stats.busy,          color: '#BA7517', bg: '#FAEEDA' },
  ];

  /* ── Filtered + sorted lead rows ── */
  const displayedLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = leads.filter((l) => {
      const matchSearch = !q
        || l.name?.toLowerCase().includes(q)
        || l.companyName?.toLowerCase().includes(q)
        || l.phone?.includes(q);
      const matchOutcome = !outcomeFilter || l.callOutcome === outcomeFilter;
      return matchSearch && matchOutcome;
    });

    rows = [...rows].sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === 'calledAt') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else if (sortField === 'name') {
        av = (av || '').toLowerCase();
        bv = (bv || '').toLowerCase();
      } else if (sortField === 'attempts') {
        av = av ?? 0;
        bv = bv ?? 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    return rows;
  }, [leads, search, outcomeFilter, sortField, sortDir]);

  const statusMeta = campaign?.status ? (CAMPAIGN_STATUS_META[campaign.status] || CAMPAIGN_STATUS_META.PAUSED) : null;

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <PageWrapper title="Voice Calls">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>

        {/* Title + status */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1A1A18' }}>
            {loading ? '—' : (campaign?.name || 'Voice Calls')}
          </Typography>
          {statusMeta && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: statusMeta.bg, color: statusMeta.text, fontFamily: 'DM Sans, sans-serif',
            }}>
              {statusMeta.label}
            </span>
          )}
        </Box>

        {/* New Batch button */}
        <Button
          variant="contained"
          size="small"
          startIcon={<AddOutlined sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/calls/new')}
          sx={{ height: 36, fontSize: 12, textTransform: 'none', whiteSpace: 'nowrap' }}
        >
          New Batch
        </Button>

        {/* Campaign selector */}
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel sx={{ fontSize: 13 }}>Campaign</InputLabel>
          <Select
            label="Campaign"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            sx={{ fontSize: 13, height: 36 }}
          >
            {campaigns.length === 0 && (
              <MenuItem value="" disabled sx={{ fontSize: 13 }}>No campaigns</MenuItem>
            )}
            {campaigns.map((c) => (
              <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13 }}>
                {c.batchName || c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Pause / Resume */}
        {campaign && campaign.status !== 'COMPLETED' && (
          <Button
            variant={campaign.status === 'LIVE' ? 'outlined' : 'contained'}
            size="small"
            startIcon={actionLoading
              ? <CircularProgress size={14} color="inherit" />
              : campaign.status === 'LIVE'
                ? <PauseOutlined sx={{ fontSize: 16 }} />
                : <PlayArrowOutlined sx={{ fontSize: 16 }} />}
            onClick={handlePauseResume}
            disabled={actionLoading}
            sx={{
              height: 36, minWidth: 110,
              ...(campaign.status === 'LIVE'
                ? { borderColor: '#E3E1DA', color: '#5A5A56', '&:hover': { borderColor: '#BA7517', color: '#BA7517', background: '#FAEEDA' } }
                : {}),
            }}
          >
            {campaign.status === 'LIVE' ? 'Pause Campaign' : 'Resume Campaign'}
          </Button>
        )}

        {/* Refresh */}
        <Tooltip title="Refresh data">
          <IconButton
            size="small"
            onClick={() => { loadCampaign(); loadLeads(); }}
            sx={{ border: '1px solid #E3E1DA', borderRadius: '8px', p: 0.75 }}
          >
            <RefreshOutlined sx={{ fontSize: 16, color: '#5A5A56' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      {/* ── KPI Bar ────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <MetricCard
          label="Total Leads" value={stats.total}
          icon={PeopleOutlined} color="#185FA5"
        />
        <MetricCard
          label="Called Today" value={stats.calledToday}
          icon={PhoneOutlined} color="#534AB7"
          subLabel={stats.total > 0 ? `${Math.round((stats.calledToday / stats.total) * 100)}% of total` : undefined}
        />
        <MetricCard
          label="Interested" value={stats.interested}
          icon={CheckCircleOutlined} color="#0F6E56"
          subLabel={stats.called > 0 ? `${Math.round((stats.interested / stats.called) * 100)}% of called` : undefined}
        />
        <MetricCard
          label="Not Interested" value={stats.notInterested}
          icon={CancelOutlined} color="#A32D2D"
        />
        <MetricCard
          label="Not Answered" value={stats.notAnswered}
          icon={PhoneMissedOutlined} color="#5A5A56"
        />
      </Box>

      {/* ── Today's Progress ───────────────────────────────────────────────── */}
      <Card sx={{ mb: 2, border: '1px solid #E3E1DA', boxShadow: 'none' }}>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Today's Progress</Typography>
            <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', color: '#5A5A56' }}>
              {stats.called} / {stats.total} called
            </Typography>
          </Box>

          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 8, borderRadius: 4, mb: 0.75,
              background: '#F0EEE9',
              '& .MuiLinearProgress-bar': { background: '#185FA5', borderRadius: 4 },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: 10, color: '#5A5A56' }}>0</Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#185FA5' }}>
              {progressPct}% complete
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#5A5A56' }}>{stats.total}</Typography>
          </Box>

          {/* Outcome pills */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {pills.map((p) => {
              const pct = stats.called > 0 ? Math.round((p.count / stats.called) * 100) : 0;
              return (
                <Box
                  key={p.label}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    background: p.bg, border: `1px solid ${p.bg}`,
                    borderRadius: '8px', px: 1.5, py: 0.75,
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: '#5A5A56', fontWeight: 500 }}>
                    {p.label}
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: p.color, fontFamily: 'DM Mono', lineHeight: 1 }}>
                    {p.count}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: '#5A5A56' }}>
                    ({pct}%)
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* ── Lead Table ─────────────────────────────────────────────────────── */}
      <Card sx={{ border: '1px solid #E3E1DA', boxShadow: 'none' }}>

        {/* Filter bar */}
        <Box sx={{
          px: 2, py: 1.25, borderBottom: '1px solid #F0EEE9',
          display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', border: '1px solid #E3E1DA',
            borderRadius: '8px', px: 1.5, height: 34, gap: 1, minWidth: 220,
          }}>
            <SearchOutlined sx={{ fontSize: 14, color: '#5A5A56', flexShrink: 0 }} />
            <InputBase
              placeholder="Search name, company, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ fontSize: 12, fontFamily: 'DM Sans', flex: 1 }}
            />
          </Box>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontSize: 13 }}>Outcome</InputLabel>
            <Select
              label="Outcome"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              sx={{ fontSize: 13, height: 34 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All Outcomes</MenuItem>
              {Object.entries(OUTCOME_META).map(([val, m]) => (
                <MenuItem key={val} value={val} sx={{ fontSize: 13 }}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Attempt-warning legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
            <WarningAmberOutlined sx={{ fontSize: 13, color: '#BA7517' }} />
            <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>
              3+ attempts, no answer
            </Typography>
          </Box>

          <Typography sx={{ fontSize: 12, color: '#5A5A56', ml: 'auto', fontFamily: 'DM Mono' }}>
            {displayedLeads.length} leads
          </Typography>
        </Box>

        {/* Table */}
        {leadsLoading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: '1px solid #F0EEE9' }}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <Box key={j} sx={{ flex: j === 0 ? 2 : 1, height: 14, background: '#F0EEE9', borderRadius: '4px' }} />
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {COLS.map((col) => (
                    <TableCell
                      key={col.field}
                      sx={{
                        ...HEADER_CELL_SX,
                        width: col.width,
                        cursor: col.sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        '&:hover': col.sortable ? { background: '#EDECE8' } : {},
                      }}
                      onClick={() => col.sortable && handleSort(col.field)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {col.label}
                        {col.sortable && (
                          <SortIcon field={col.field} sortField={sortField} sortDir={sortDir} />
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {displayedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLS.length}
                      sx={{ border: 'none', py: 7, textAlign: 'center', color: '#5A5A56', fontSize: 13 }}
                    >
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedLeads.map((row) => {
                    const isOverAttempts = (row.attempts ?? 0) >= 3 && row.callOutcome === 'NO_ANSWER';
                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          background: isOverAttempts ? '#FFFBF0' : 'transparent',
                          '&:hover': { background: isOverAttempts ? '#FFF5D6' : '#F7F6F3' },
                        }}
                      >
                        {/* Lead Name */}
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18' }}>
                            {row.name || '—'}
                          </Typography>
                        </TableCell>

                        {/* Company */}
                        <TableCell>
                          <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>
                            {row.companyName || '—'}
                          </Typography>
                        </TableCell>

                        {/* Phone */}
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', color: '#5A5A56' }}>
                            {row.phone || '—'}
                          </Typography>
                        </TableCell>

                        {/* Called At */}
                        <TableCell>
                          <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#5A5A56' }}>
                            {row.calledAt ? formatDateTime(row.calledAt) : '—'}
                          </Typography>
                        </TableCell>

                        {/* Attempts — amber if 3+ with no answer */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{
                              fontSize: 13, fontFamily: 'DM Mono', fontWeight: 700,
                              color: isOverAttempts ? '#BA7517' : '#1A1A18',
                            }}>
                              {row.attempts ?? 0}
                            </Typography>
                            {isOverAttempts && (
                              <Tooltip title="3+ attempts with no answer — consider reassigning or marking as lost">
                                <WarningAmberOutlined sx={{ fontSize: 14, color: '#BA7517' }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Outcome */}
                        <TableCell>
                          <OutcomeBadge outcome={row.callOutcome || 'PENDING'} />
                        </TableCell>

                        {/* View action */}
                        <TableCell align="right" sx={{ pr: 1.5 }}>
                          <Tooltip title="View lead">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/leads/${row.leadId || row.id}`)}
                              sx={{ '&:hover': { color: '#185FA5' } }}
                            >
                              <VisibilityOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </PageWrapper>
  );
}
