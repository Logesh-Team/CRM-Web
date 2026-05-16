import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem, Button,
} from '@mui/material';
import { RefreshOutlined } from '@mui/icons-material';
import GradeBadge from '../components/common/GradeBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import PageWrapper from '../components/common/PageWrapper';
import { formatLakh } from '../utils/formatCurrency';
import axiosInstance from '../api/axiosInstance';
import { LEADS } from '../api/endpoints';

const PIPELINE_STAGES = [
  { status: 'NEW',            label: 'New',             color: '#5A5A56' },
  { status: 'IN_FOLLOW_UP',   label: 'In Follow-up',    color: '#185FA5' },
  { status: 'DEMO_SCHEDULED', label: 'Demo Scheduled',  color: '#0F6E56' },
  { status: 'DEMO_DONE',      label: 'Demo Done',       color: '#3B6D11' },
  { status: 'QUOTATION_SENT', label: 'Quotation Sent',  color: '#BA7517' },
  { status: 'NEGOTIATION',    label: 'Negotiation',     color: '#7A3F91' },
  { status: 'CONVERTED_WON',  label: 'Converted / Won', color: '#3B6D11' },
];

function getDateRange(period) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (period === 'day') {
    return { dateFrom: fmt(today), dateTo: fmt(today) };
  }
  if (period === 'week') {
    const mon = new Date(today);
    mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    return { dateFrom: fmt(mon), dateTo: fmt(today) };
  }
  if (period === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { dateFrom: fmt(first), dateTo: fmt(today) };
  }
  return {};
}

function LeadCard({ lead, stageColor, onClick }) {
  return (
    <Card
      onClick={() => onClick(lead)}
      sx={{
        mb: 1.5,
        borderLeft: `3px solid ${stageColor}`,
        cursor: 'pointer',
        boxShadow: 'none',
        border: '1px solid #E3E1DA',
        borderLeft: `3px solid ${stageColor}`,
        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderColor: stageColor },
        borderRadius: '8px',
        flexShrink: 0,
      }}
    >
      <CardContent sx={{ p: '10px 12px !important' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.25, color: '#1A1A18', lineHeight: 1.4 }}>
          {lead.companyName}
        </Typography>
        {lead.primaryContactName && (
          <Typography sx={{ fontSize: 11, color: '#5A5A56', mb: 0.5 }}>
            {lead.primaryContactName}
          </Typography>
        )}
        <Typography sx={{ fontSize: 10, color: '#8A8A84', mb: 0.75 }}>
          {lead.city || '—'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
          <GradeBadge grade={lead.leadGrade} />
          <PriorityBadge priority={lead.leadPriority} />
          {lead.estimatedDealValue > 0 && (
            <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#3B6D11', ml: 'auto' }}>
              {formatLakh(lead.estimatedDealValue)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState('all');
  const [grade, setGrade] = useState('');
  const [priority, setPriority] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const dateParams = getDateRange(period);
    const results = {};
    await Promise.all(
      PIPELINE_STAGES.map(async (stage) => {
        try {
          const res = await axiosInstance.get(LEADS.LIST, {
            params: {
              status: stage.status,
              size: 100,
              ...(grade    && { grade }),
              ...(priority && { priority }),
              ...dateParams,
            },
          });
          const d = res.data?.data;
          results[stage.status] = Array.isArray(d) ? d : (d?.content || []);
        } catch {
          results[stage.status] = [];
        }
      })
    );
    setColumns(results);
    setLoading(false);
  }, [period, grade, priority]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalLeads = PIPELINE_STAGES.reduce((s, st) => s + (columns[st.status]?.length || 0), 0);
  const totalValue = PIPELINE_STAGES.reduce(
    (s, st) => s + (columns[st.status] || []).reduce((a, l) => a + (l.estimatedDealValue || 0), 0), 0
  );

  return (
    <PageWrapper title="Pipeline">
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1A1A18' }}>Pipeline</Typography>
          {!loading && (
            <Typography sx={{ fontSize: 12, color: '#5A5A56', mt: 0.25 }}>
              {totalLeads} leads · {formatLakh(totalValue)} total value
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Period toggle */}
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, v) => { if (v) setPeriod(v); }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                fontSize: 11, fontWeight: 600, px: 1.5, py: 0.5, height: 32,
                textTransform: 'none', border: '1px solid #E3E1DA', color: '#5A5A56',
                '&.Mui-selected': { background: '#1A1A18', color: '#fff', borderColor: '#1A1A18' },
              },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="day">Today</ToggleButton>
          </ToggleButtonGroup>

          {/* Grade filter */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ fontSize: 12 }}>Grade</InputLabel>
            <Select
              label="Grade" value={grade}
              onChange={e => setGrade(e.target.value)}
              sx={{ fontSize: 12, height: 32 }}
            >
              <MenuItem value="" sx={{ fontSize: 12 }}>All</MenuItem>
              {['A', 'B', 'C', 'D'].map(g => (
                <MenuItem key={g} value={g} sx={{ fontSize: 12 }}>Grade {g}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Priority filter */}
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel sx={{ fontSize: 12 }}>Priority</InputLabel>
            <Select
              label="Priority" value={priority}
              onChange={e => setPriority(e.target.value)}
              sx={{ fontSize: 12, height: 32 }}
            >
              <MenuItem value="" sx={{ fontSize: 12 }}>All</MenuItem>
              {['HOT', 'WARM', 'COLD'].map(p => (
                <MenuItem key={p} value={p} sx={{ fontSize: 12 }}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            size="small" variant="outlined"
            startIcon={<RefreshOutlined sx={{ fontSize: 14 }} />}
            onClick={fetchAll}
            sx={{ height: 32, fontSize: 11, borderColor: '#E3E1DA', color: '#5A5A56', minWidth: 0, px: 1.5 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Board */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            height: 'calc(100vh - 240px)',
            pb: 1,
          }}
        >
          {PIPELINE_STAGES.map((stage) => {
            const leads = columns[stage.status] || [];
            const colValue = leads.reduce((s, l) => s + (l.estimatedDealValue || 0), 0);

            return (
              <Box
                key={stage.status}
                sx={{
                  flex: '0 0 230px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                {/* Column header */}
                <Box
                  sx={{
                    px: 1.5, py: 1,
                    background: '#F7F6F3',
                    border: '1px solid #E3E1DA',
                    borderRadius: '8px 8px 0 0',
                    borderBottom: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1A1A18', flex: 1 }}>
                    {stage.label}
                  </Typography>
                  <Chip label={leads.length} size="small"
                    sx={{ height: 17, fontSize: 10, fontFamily: 'DM Mono', background: '#E3E1DA', '& .MuiChip-label': { px: 0.75 } }} />
                </Box>

                {/* Deal value sub-header */}
                {colValue > 0 && (
                  <Box sx={{
                    px: 1.5, py: 0.5,
                    background: '#F7F6F3',
                    border: '1px solid #E3E1DA',
                    borderTop: '1px dashed #E3E1DA',
                    borderBottom: 'none',
                    flexShrink: 0,
                  }}>
                    <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#3B6D11' }}>
                      {formatLakh(colValue)} total
                    </Typography>
                  </Box>
                )}

                {/* Scrollable cards area */}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    border: '1px solid #E3E1DA',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    background: '#FAFAF9',
                    p: 1.25,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { background: '#D5D2CA', borderRadius: 2 },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                  }}
                >
                  {leads.length === 0 ? (
                    <Typography sx={{ fontSize: 11, color: '#AEADA6', textAlign: 'center', pt: 4 }}>
                      No leads
                    </Typography>
                  ) : (
                    leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stageColor={stage.color}
                        onClick={(l) => navigate(`/leads/${l.id}`)}
                      />
                    ))
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </PageWrapper>
  );
}
