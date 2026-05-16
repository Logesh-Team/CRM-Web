import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress,
  Chip, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  PeopleOutlined, DescriptionOutlined, VideocamOutlined,
  WarningAmberOutlined, SwapHorizOutlined, ArrowUpwardOutlined, ArrowDownwardOutlined,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import { DASHBOARD_MGR, USERS } from '../../api/endpoints';
import PageWrapper from '../../components/common/PageWrapper';
import EmptyState from '../../components/common/EmptyState';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const CHART_COLORS = ['#185FA5', '#534AB7', '#0F6E56', '#BA7517', '#A32D2D', '#3B6D11', '#5A5A56', '#1A1A18'];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function MetricCard({ label, value, icon: Icon, color, highlight }) {
  return (
    <Card sx={{ border: '1px solid #E3E1DA' }}>
      <CardContent sx={{ p: '16px 20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
          <Box sx={{ width: 28, height: 28, borderRadius: '7px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ fontSize: 15, color }} />
          </Box>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 300, fontFamily: 'DM Mono', color: highlight ? '#A32D2D' : '#1A1A18' }}>
          {value ?? '—'}
        </Typography>
      </CardContent>
    </Card>
  );
}

function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;
  return (
    <TableCell
      sx={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#5A5A56',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        '&:hover': { color: '#1A1A18' },
      }}
      onClick={() => onSort(sortKey)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {label}
        {isActive ? (
          sortConfig.dir === 'asc'
            ? <ArrowUpwardOutlined sx={{ fontSize: 12 }} />
            : <ArrowDownwardOutlined sx={{ fontSize: 12 }} />
        ) : null}
      </Box>
    </TableCell>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [pipelineData, setPipelineData] = useState([]);
  const [callBatchSummary, setCallBatchSummary] = useState([]);
  const [conversionFunnel, setConversionFunnel] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [revenueForecast, setRevenueForecast] = useState([]);
  const [overdueEscalation, setOverdueEscalation] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Leaderboard sort
  const [sortConfig, setSortConfig] = useState({ key: 'rank', dir: 'asc' });

  // Reassign dialog
  const [reassignDialog, setReassignDialog] = useState({ open: false, lead: null });
  const [selectedUser, setSelectedUser] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchAll = useCallback(() => {
    const promises = [
      // /manager/summary returns { totalLeads, newToday, inFollowUp, demoScheduled, convertedWon, closedLost, overdueFollowUps, totalPipelineValue, activeExecs }
      axiosInstance.get(DASHBOARD_MGR.SUMMARY).then(r => {
        const s = r.data?.data;
        if (s) {
          setSummary({
            ...s,
            activeLeads: s.totalLeads,
            openQuotations: s.openQuotations ?? 0,
            demosThisWeek: s.demoScheduled,
            overdueFollowups: s.overdueFollowUps,
          });
        }
      }).catch(() => {}),
      // /manager/pipeline-overview returns { stages: [{stage, count}], totalPipelineValue }
      // Transform to simple [{stage, count}] array for the bar chart
      axiosInstance.get(DASHBOARD_MGR.PIPELINE_OVERVIEW).then(r => {
        const stages = r.data?.data?.stages ?? [];
        setPipelineData(stages.map(s => ({ stage: s.stage, count: s.count })));
      }).catch(() => {}),
      axiosInstance.get(DASHBOARD_MGR.CALL_BATCH_SUMMARY).then(r => setCallBatchSummary(r.data?.data ?? [])).catch(() => {}),
      // /manager/conversions returns { totalLeads, totalConverted, overallConversionRate, funnel: [{stage, count, conversionRateFromPrev}] }
      axiosInstance.get(DASHBOARD_MGR.CONVERSION_FUNNEL).then(r => {
        const funnel = r.data?.data?.funnel ?? [];
        setConversionFunnel(funnel.map(f => ({
          ...f,
          dropOffPct: f.conversionRateFromPrev,
        })));
      }).catch(() => {}),
      // /manager/team-performance returns { executives: [{assignedTo, totalLeads, demoScheduled, convertedWon, pipelineValue, conversionRate, ...}] }
      axiosInstance.get(DASHBOARD_MGR.LEADERBOARD).then(r => {
        const executives = r.data?.data?.executives ?? [];
        const sorted = [...executives].sort((a, b) => (b.convertedWon ?? 0) - (a.convertedWon ?? 0));
        setLeaderboard(sorted.map((e, i) => ({
          rank: i + 1,
          name: e.assignedTo,
          leadsAssigned: e.totalLeads,
          demosDone: e.demoScheduled,
          dealsWon: e.convertedWon,
          revenue: e.pipelineValue,
        })));
      }).catch(() => {}),
      axiosInstance.get(DASHBOARD_MGR.REVENUE_FORECAST).then(r => setRevenueForecast(r.data?.data ?? [])).catch(() => {}),
      // /manager/overdue returns { overdueCount, dueTodayCount, items: [{leadId, companyName, assignedTo, nextFollowUpDate, daysOverdue, leadStatus}] }
      axiosInstance.get(DASHBOARD_MGR.OVERDUE_ESCALATION).then(r => {
        const items = r.data?.data?.items ?? [];
        setOverdueEscalation(items.map(i => ({
          leadId: i.leadId,
          leadName: i.companyName,
          assignedTo: i.assignedTo,
          lastActivityDate: i.nextFollowUpDate,
          daysSince: i.daysOverdue,
          stage: i.leadStatus,
        })));
      }).catch(() => {}),
    ];
    Promise.all(promises).finally(() => {
      setLoading(false);
      setLastUpdated(new Date());
    });
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 300000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const fetchUsers = useCallback(() => {
    axiosInstance.get(USERS.LIST).then(r => {
      const data = r.data?.data;
      if (Array.isArray(data)) setUsers(data);
      else if (data?.content) setUsers(data.content);
    }).catch(() => {});
  }, []);

  const getMinutesAgo = () => {
    if (!lastUpdated) return null;
    const diff = Math.floor((new Date() - lastUpdated) / 60000);
    if (diff < 1) return 'just now';
    return `${diff} min${diff !== 1 ? 's' : ''} ago`;
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const { key, dir } = sortConfig;
    const aVal = a[key] ?? 0;
    const bVal = b[key] ?? 0;
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
    return dir === 'asc' ? cmp : -cmp;
  });

  const openReassign = (lead) => {
    setReassignDialog({ open: true, lead });
    setSelectedUser('');
    if (users.length === 0) fetchUsers();
  };

  const closeReassign = () => {
    setReassignDialog({ open: false, lead: null });
    setSelectedUser('');
  };

  const handleReassign = () => {
    if (!selectedUser || !reassignDialog.lead) return;
    setReassigning(true);
    axiosInstance
      .patch(`/leads/${reassignDialog.lead.leadId}/assign`, { assignedTo: selectedUser })
      .then(() => {
        setOverdueEscalation(prev =>
          prev.map(item =>
            item.leadId === reassignDialog.lead.leadId
              ? { ...item, assignedTo: users.find(u => u.id === selectedUser)?.name ?? selectedUser }
              : item
          )
        );
        closeReassign();
      })
      .catch(() => {})
      .finally(() => setReassigning(false));
  };

  const maxFunnelCount = Math.max(...conversionFunnel.map(s => s.count ?? 0), 1);

  const daysSinceChipColor = (days) => {
    if (days > 7) return { background: '#A32D2D15', color: '#A32D2D' };
    if (days >= 4) return { background: '#BA751715', color: '#BA7517' };
    return { background: '#3B6D1115', color: '#3B6D11' };
  };

  const TABLE_CELL_SX = { fontSize: 11, color: '#1A1A18', py: 1, px: 1.5 };
  const TABLE_HEAD_SX = { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', py: 1, px: 1.5, whiteSpace: 'nowrap' };

  return (
    <PageWrapper title="Manager Dashboard">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 0.5, color: '#1A1A18' }}>
          Manager Dashboard
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>
          Team sales performance overview
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!loading && (
        <>
          {/* ROW 1 — Metric Cards */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="Active Leads (Team)"
                value={summary?.activeLeads}
                icon={PeopleOutlined}
                color="#185FA5"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="Open Quotations"
                value={summary?.openQuotations}
                icon={DescriptionOutlined}
                color="#534AB7"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="Demos This Week"
                value={summary?.demosThisWeek}
                icon={VideocamOutlined}
                color="#0F6E56"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="Overdue Follow-ups"
                value={summary?.overdueFollowups}
                icon={WarningAmberOutlined}
                color="#A32D2D"
                highlight={(summary?.overdueFollowups ?? 0) > 0}
              />
            </Grid>
          </Grid>

          {/* ROW 2 — Team Pipeline Overview (full width) */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid #E3E1DA' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Team Pipeline Overview
                  </Typography>
                  {pipelineData.length === 0 ? (
                    <EmptyState message="No pipeline data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={pipelineData}
                        margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
                      >
                        <XAxis
                          dataKey="stage"
                          tick={{ fontSize: 10, fill: '#5A5A56' }}
                        />
                        <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: '#5A5A56' }} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E3E1DA' }}
                          cursor={{ fill: '#F7F6F3' }}
                        />
                        <Bar dataKey="count" fill="#185FA5" radius={[3, 3, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ROW 3 — Call Batch Summary & Conversion Funnel */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Call Batch Summary */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Call Batch Summary
                  </Typography>
                  {callBatchSummary.length === 0 ? (
                    <EmptyState message="No call batch data" />
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ background: '#F7F6F3' }}>
                            <TableCell sx={TABLE_HEAD_SX}>Batch Name</TableCell>
                            <TableCell sx={TABLE_HEAD_SX}>Date</TableCell>
                            <TableCell sx={{ ...TABLE_HEAD_SX, textAlign: 'center' }}>Total</TableCell>
                            <TableCell sx={{ ...TABLE_HEAD_SX, textAlign: 'center' }}>Int.</TableCell>
                            <TableCell sx={{ ...TABLE_HEAD_SX, textAlign: 'center' }}>Not Int.</TableCell>
                            <TableCell sx={{ ...TABLE_HEAD_SX, textAlign: 'center' }}>No Ans.</TableCell>
                            <TableCell sx={{ ...TABLE_HEAD_SX, textAlign: 'center' }}>Pending</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {callBatchSummary.slice(0, 8).map((batch, i) => (
                            <TableRow
                              key={i}
                              sx={{ '&:hover': { background: '#F7F6F3' }, '&:last-child td': { border: 0 } }}
                            >
                              <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {batch.batchName}
                              </TableCell>
                              <TableCell sx={{ ...TABLE_CELL_SX, fontFamily: 'DM Mono', fontSize: 10, color: '#5A5A56' }}>
                                {formatDate(batch.date)}
                              </TableCell>
                              <TableCell sx={{ ...TABLE_CELL_SX, textAlign: 'center', fontFamily: 'DM Mono' }}>
                                {batch.total}
                              </TableCell>
                              <TableCell sx={{ ...TABLE_CELL_SX, textAlign: 'center', color: '#3B6D11', fontFamily: 'DM Mono' }}>
                                {batch.interested}
                              </TableCell>
                              <TableCell sx={{ ...TABLE_CELL_SX, textAlign: 'center', color: '#A32D2D', fontFamily: 'DM Mono' }}>
                                {batch.notInterested}
                              </TableCell>
                              <TableCell sx={{ ...TABLE_CELL_SX, textAlign: 'center', color: '#5A5A56', fontFamily: 'DM Mono' }}>
                                {batch.noAnswer}
                              </TableCell>
                              <TableCell sx={{ ...TABLE_CELL_SX, textAlign: 'center', color: '#BA7517', fontFamily: 'DM Mono' }}>
                                {batch.pending}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Conversion Funnel */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Conversion Funnel
                  </Typography>
                  {conversionFunnel.length === 0 ? (
                    <EmptyState message="No funnel data available" />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {conversionFunnel.map((stage, i) => {
                        const pct = maxFunnelCount > 0 ? (stage.count / maxFunnelCount) * 100 : 0;
                        const stageColor = CHART_COLORS[i % CHART_COLORS.length];
                        return (
                          <Box key={stage.stage ?? i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ fontSize: 11, color: '#5A5A56', width: 110, flexShrink: 0, textAlign: 'right', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {stage.stage}
                            </Typography>
                            <Box
                              sx={{
                                flex: 1,
                                height: 20,
                                background: '#F0EEE9',
                                borderRadius: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  background: stageColor,
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  pr: 0.75,
                                  minWidth: stage.count > 0 ? 24 : 0,
                                  transition: 'width 0.8s ease',
                                }}
                              >
                                {stage.count > 0 && (
                                  <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#fff', fontWeight: 600 }}>
                                    {stage.count}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ width: 50, textAlign: 'right', flexShrink: 0 }}>
                              <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#5A5A56' }}>
                                {stage.count}
                              </Typography>
                              {stage.dropOffPct !== undefined && stage.dropOffPct !== null && (
                                <Typography sx={{ fontSize: 9, color: '#A32D2D', fontFamily: 'DM Mono' }}>
                                  -{stage.dropOffPct}%
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ROW 4 — Leaderboard & Revenue Forecast */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Leaderboard (md=7) */}
            <Grid item xs={12} md={7}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Sales Person Leaderboard
                  </Typography>
                  {leaderboard.length === 0 ? (
                    <EmptyState message="No leaderboard data" />
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ background: '#F7F6F3' }}>
                            <TableCell sx={TABLE_HEAD_SX}>#</TableCell>
                            <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Leads" sortKey="leadsAssigned" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Demos" sortKey="demosDone" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Won" sortKey="dealsWon" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Revenue ₹" sortKey="revenue" sortConfig={sortConfig} onSort={handleSort} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedLeaderboard.map((person, i) => {
                            const originalRank = person.rank ?? i + 1;
                            return (
                              <TableRow
                                key={person.name ?? i}
                                sx={{ '&:hover': { background: '#F7F6F3' }, '&:last-child td': { border: 0 } }}
                              >
                                <TableCell sx={{ ...TABLE_CELL_SX, fontFamily: 'DM Mono', width: 40 }}>
                                  {originalRank <= 3 ? RANK_MEDALS[originalRank - 1] : originalRank}
                                </TableCell>
                                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {person.name}
                                </TableCell>
                                <TableCell sx={{ ...TABLE_CELL_SX, fontFamily: 'DM Mono', textAlign: 'center' }}>
                                  {person.leadsAssigned}
                                </TableCell>
                                <TableCell sx={{ ...TABLE_CELL_SX, fontFamily: 'DM Mono', textAlign: 'center' }}>
                                  {person.demosDone}
                                </TableCell>
                                <TableCell sx={{ ...TABLE_CELL_SX, fontFamily: 'DM Mono', textAlign: 'center', color: '#3B6D11', fontWeight: 600 }}>
                                  {person.dealsWon}
                                </TableCell>
                                <TableCell sx={{ ...TABLE_CELL_SX, fontFamily: 'DM Mono', whiteSpace: 'nowrap' }}>
                                  {formatINR(person.revenue)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Revenue Forecast (md=5) */}
            <Grid item xs={12} md={5}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Revenue Forecast
                  </Typography>
                  {revenueForecast.length === 0 ? (
                    <EmptyState message="No forecast data" />
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        layout="vertical"
                        data={revenueForecast}
                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                      >
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#5A5A56' }}
                          tickFormatter={(v) => {
                            if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                            if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                            if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
                            return `₹${v}`;
                          }}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          tick={{ fontSize: 10, fill: '#5A5A56' }}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E3E1DA' }}
                          formatter={(value) => [formatINR(value), 'Amount']}
                          cursor={{ fill: '#F7F6F3' }}
                        />
                        <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={28}>
                          {revenueForecast.map((entry, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ROW 5 — Overdue Escalation (full width) */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid #E3E1DA' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Overdue Follow-up Escalation
                  </Typography>
                  {overdueEscalation.length === 0 ? (
                    <EmptyState message="No overdue follow-ups — great job!" />
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ background: '#F7F6F3' }}>
                            <TableCell sx={TABLE_HEAD_SX}>Lead Name</TableCell>
                            <TableCell sx={TABLE_HEAD_SX}>Assigned To</TableCell>
                            <TableCell sx={TABLE_HEAD_SX}>Last Activity</TableCell>
                            <TableCell sx={TABLE_HEAD_SX}>Days Since</TableCell>
                            <TableCell sx={TABLE_HEAD_SX}>Stage</TableCell>
                            <TableCell sx={TABLE_HEAD_SX}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {overdueEscalation.map((item, i) => {
                            const chipSx = daysSinceChipColor(item.daysSince);
                            return (
                              <TableRow
                                key={item.leadId ?? i}
                                sx={{ '&:hover': { background: '#F7F6F3' }, '&:last-child td': { border: 0 } }}
                              >
                                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 600 }}>
                                  <Typography
                                    sx={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#185FA5',
                                      cursor: 'pointer',
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                    onClick={() => navigate(`/leads/${item.leadId}`)}
                                  >
                                    {item.leadName}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={TABLE_CELL_SX}>
                                  {item.assignedTo ?? '—'}
                                </TableCell>
                                <TableCell sx={{ ...TABLE_CELL_SX, fontFamily: 'DM Mono', fontSize: 10, color: '#5A5A56' }}>
                                  {formatDate(item.lastActivityDate)}
                                </TableCell>
                                <TableCell sx={TABLE_CELL_SX}>
                                  <Chip
                                    label={`${item.daysSince}d`}
                                    size="small"
                                    sx={{
                                      fontSize: 10,
                                      height: 20,
                                      fontWeight: 600,
                                      fontFamily: 'DM Mono',
                                      ...chipSx,
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ ...TABLE_CELL_SX, color: '#5A5A56' }}>
                                  {item.stage}
                                </TableCell>
                                <TableCell sx={TABLE_CELL_SX}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<SwapHorizOutlined sx={{ fontSize: 13 }} />}
                                    onClick={() => openReassign(item)}
                                    sx={{
                                      fontSize: 10,
                                      height: 24,
                                      textTransform: 'none',
                                      borderColor: '#E3E1DA',
                                      color: '#5A5A56',
                                      '&:hover': { borderColor: '#185FA5', color: '#185FA5' },
                                    }}
                                  >
                                    Reassign
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Footer */}
          <Box sx={{ mt: 1, textAlign: 'right' }}>
            <Typography sx={{ fontSize: 11, color: '#5A5A56', fontFamily: 'DM Mono' }}>
              Last updated: {getMinutesAgo() ?? '—'}
            </Typography>
          </Box>
        </>
      )}

      {/* Reassign Dialog */}
      <Dialog
        open={reassignDialog.open}
        onClose={closeReassign}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '10px', border: '1px solid #E3E1DA' } }}
      >
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700, pb: 1 }}>
          Reassign Lead
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {reassignDialog.lead && (
            <Typography sx={{ fontSize: 12, color: '#5A5A56', mb: 2 }}>
              Reassigning <strong>{reassignDialog.lead.leadName}</strong> to a new sales executive.
            </Typography>
          )}
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: 12 }}>Select Executive</InputLabel>
            <Select
              value={selectedUser}
              label="Select Executive"
              onChange={(e) => setSelectedUser(e.target.value)}
              sx={{ fontSize: 12 }}
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id} sx={{ fontSize: 12 }}>
                  {u.name ?? u.fullName ?? u.email}
                </MenuItem>
              ))}
              {users.length === 0 && (
                <MenuItem disabled sx={{ fontSize: 12 }}>Loading users...</MenuItem>
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeReassign}
            size="small"
            sx={{ fontSize: 12, textTransform: 'none', color: '#5A5A56' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            size="small"
            variant="contained"
            disabled={!selectedUser || reassigning}
            sx={{
              fontSize: 12,
              textTransform: 'none',
              background: '#185FA5',
              '&:hover': { background: '#134d8a' },
            }}
          >
            {reassigning ? 'Reassigning...' : 'Confirm Reassign'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
}
