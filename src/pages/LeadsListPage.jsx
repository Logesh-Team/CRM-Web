import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputBase,
  Typography,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  RefreshOutlined,
  VisibilityOutlined,
  EditOutlined,
} from '@mui/icons-material';
import { fetchLeads, setFilters, resetFilters, setPage } from '../features/leads/leadsSlice';
import { useDebounce } from '../hooks/useDebounce';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import GradeBadge from '../components/common/GradeBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import PageWrapper from '../components/common/PageWrapper';
import { formatINR } from '../utils/formatCurrency';
import { timeAgo } from '../utils/formatDate';

const STATUSES = [
  'NEW','AI_CALL_SCHEDULED','AI_CALL_DONE_INTERESTED','AI_CALL_DONE_NOT_INTERESTED',
  'IN_FOLLOW_UP','DEMO_SCHEDULED','DEMO_DONE','QUOTATION_SENT','NEGOTIATION',
  'CONVERTED_WON','CLOSED_LOST','ON_HOLD',
];
const STATUS_LABELS = {
  NEW: 'New', AI_CALL_SCHEDULED: 'AI Call Scheduled', AI_CALL_DONE_INTERESTED: 'AI Call · Interested',
  AI_CALL_DONE_NOT_INTERESTED: 'AI Call · Not Interested', IN_FOLLOW_UP: 'In Follow-up',
  DEMO_SCHEDULED: 'Demo Scheduled', DEMO_DONE: 'Demo Done', QUOTATION_SENT: 'Quotation Sent',
  NEGOTIATION: 'Negotiation', CONVERTED_WON: 'Converted / Won', CLOSED_LOST: 'Closed Lost', ON_HOLD: 'On Hold',
};

const COLUMNS = [
  { key: 'leadId', label: 'Lead ID', width: 100 },
  { key: 'companyName', label: 'Company' },
  { key: 'city', label: 'City', width: 100 },
  { key: 'industryType', label: 'Industry', width: 120 },
  { key: 'leadStatus', label: 'Status', width: 160 },
  { key: 'leadGrade', label: 'Grade', width: 60, align: 'center' },
  { key: 'leadPriority', label: 'Priority', width: 80, align: 'center' },
  { key: 'estimatedDealValue', label: 'Deal Value', width: 110, align: 'right' },
  { key: 'assignedToName', label: 'Assigned To', width: 120 },
  { key: 'lastActivityAt', label: 'Last Activity', width: 100 },
  { key: '_actions', label: '', width: 70, align: 'right' },
];

export default function LeadsListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leads, loading, error, pagination, filters } = useSelector((state) => state.leads);

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 400);

  const loadLeads = useCallback(() => {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...(filters.status && { status: filters.status }),
      ...(filters.grade && { grade: filters.grade }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.city && { city: filters.city }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
      ...(debouncedSearch && { search: debouncedSearch }),
    };
    dispatch(fetchLeads(params));
  }, [dispatch, pagination.page, pagination.size, filters, debouncedSearch]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  useEffect(() => {
    dispatch(setFilters({ search: debouncedSearch }));
  }, [debouncedSearch, dispatch]);

  const handleFilterChange = (key, value) => dispatch(setFilters({ [key]: value }));
  const handleReset = () => { dispatch(resetFilters()); setSearchInput(''); };
  const handlePageChange = (_, page) => dispatch(setPage(page - 1));

  const columns = COLUMNS.map((col) => ({
    ...col,
    render: (val, row) => {
      if (col.key === 'leadId') return (
        <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', color: '#185FA5', fontWeight: 500 }}>
          {val || row.id}
        </Typography>
      );
      if (col.key === 'leadStatus') return <StatusBadge status={val} />;
      if (col.key === 'leadGrade') return <Box sx={{ display: 'flex', justifyContent: 'center' }}><GradeBadge grade={val} /></Box>;
      if (col.key === 'leadPriority') return <Box sx={{ display: 'flex', justifyContent: 'center' }}><PriorityBadge priority={val} /></Box>;
      if (col.key === 'estimatedDealValue') return (
        <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', textAlign: 'right' }}>
          {val ? formatINR(val) : '—'}
        </Typography>
      );
      if (col.key === 'lastActivityAt') return <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>{val ? timeAgo(val) : '—'}</Typography>;
      if (col.key === '_actions') return (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/leads/${row.id}`)}>
              <VisibilityOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => navigate(`/leads/${row.id}/edit`)}>
              <EditOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
            </IconButton>
          </Tooltip>
        </Box>
      );
      return val || '—';
    },
  }));

  return (
    <PageWrapper title="All Leads">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>All Leads</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddOutlined />}
          onClick={() => navigate('/leads/new')}
        >
          New Lead
        </Button>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      {/* Filter bar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: '12px 16px !important' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #E3E1DA',
                borderRadius: '8px',
                px: 1.5,
                height: 36,
                gap: 1,
                minWidth: 200,
              }}
            >
              <SearchOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
              <InputBase
                placeholder="Search company, contact…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                sx={{ fontSize: 13, fontFamily: 'DM Sans', flex: 1 }}
              />
            </Box>

            {[
              { key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
              { key: 'grade', label: 'Grade', options: ['A','B','C','D'].map((g) => ({ value: g, label: `Grade ${g}` })) },
              { key: 'priority', label: 'Priority', options: ['HOT','WARM','COLD'].map((p) => ({ value: p, label: p })) },
            ].map((f) => (
              <FormControl key={f.key} size="small" sx={{ minWidth: 130 }}>
                <InputLabel sx={{ fontSize: 13 }}>{f.label}</InputLabel>
                <Select
                  label={f.label}
                  value={filters[f.key] || ''}
                  onChange={(e) => handleFilterChange(f.key, e.target.value)}
                  sx={{ fontSize: 13, height: 36 }}
                >
                  <MenuItem value="">All</MenuItem>
                  {f.options.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshOutlined />}
              onClick={handleReset}
              sx={{ height: 36, color: '#5A5A56', borderColor: '#E3E1DA' }}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          rows={leads}
          loading={loading}
          onRowClick={(row) => navigate(`/leads/${row.id}`)}
          keyField="id"
        />
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #F0EEE9' }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page + 1}
              onChange={handlePageChange}
              size="small"
              shape="rounded"
            />
          </Box>
        )}
      </Card>
    </PageWrapper>
  );
}
