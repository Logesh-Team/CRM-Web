import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  AddOutlined,
  SearchOutlined,
  RefreshOutlined,
  VisibilityOutlined,
  EditOutlined,
  FileDownloadOutlined,
  FileUploadOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
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
import axiosInstance from '../api/axiosInstance';
import { LEADS } from '../api/endpoints';

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
  { key: 'createdAt', label: 'Created', width: 105 },
  { key: 'lastActivityAt', label: 'Last Activity', width: 100 },
  { key: '_actions', label: '', width: 70, align: 'right' },
];

function ImportResultDialog({ open, result, onClose }) {
  if (!result) return null;
  const hasErrors = result.errors && result.errors.length > 0;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>Import Result</DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{
            flex: 1, background: '#F0F9F0', border: '1px solid #B5D98C',
            borderRadius: '8px', p: 2, textAlign: 'center',
          }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#3B6D11', fontFamily: 'DM Mono' }}>
              {result.successCount}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#3B6D11' }}>Leads Created</Typography>
          </Box>
          {result.failedCount > 0 && (
            <Box sx={{
              flex: 1, background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px', p: 2, textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#A32D2D', fontFamily: 'DM Mono' }}>
                {result.failedCount}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#A32D2D' }}>Failed Rows</Typography>
            </Box>
          )}
        </Box>
        {hasErrors && (
          <>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#5A5A56', mb: 1 }}>
              Errors ({result.errors.length}):
            </Typography>
            <Box sx={{
              maxHeight: 200, overflowY: 'auto',
              border: '1px solid #E3E1DA', borderRadius: '8px',
              background: '#FAFAF8',
            }}>
              <List dense disablePadding>
                {result.errors.map((err, i) => (
                  <React.Fragment key={i}>
                    <ListItem sx={{ py: 0.75, px: 1.5 }}>
                      <ListItemText
                        primary={err}
                        primaryTypographyProps={{ fontSize: 11, color: '#A32D2D', fontFamily: 'DM Mono' }}
                      />
                    </ListItem>
                    {i < result.errors.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </>
        )}
        {!hasErrors && result.successCount > 0 && (
          <Alert severity="success" sx={{ borderRadius: '8px', fontSize: 12 }}>
            All rows imported successfully!
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained" size="small">Done</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LeadsListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leads, loading, error, pagination, filters } = useSelector((state) => state.leads);

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 400);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        ...(filters.status && { status: filters.status }),
        ...(filters.city && { city: filters.city }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
      };
      const res = await axiosInstance.get(LEADS.EXPORT, {
        params,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after an error
    e.target.value = '';

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx)');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosInstance.post(LEADS.IMPORT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res.data?.data;
      setImportResult(result);
      if (result?.successCount > 0) loadLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

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
      if (col.key === 'createdAt') return <Typography sx={{ fontSize: 11, color: '#5A5A56', fontFamily: 'DM Mono' }}>{val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</Typography>;
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>All Leads</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Download import template / export current leads">
            <Button
              variant="outlined"
              size="small"
              startIcon={exporting ? <CircularProgress size={13} color="inherit" /> : <FileDownloadOutlined />}
              onClick={handleExport}
              disabled={exporting}
              sx={{ height: 34, fontSize: 12, borderColor: '#E3E1DA', color: '#5A5A56' }}
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Import leads from Excel (.xlsx)">
            <Button
              variant="outlined"
              size="small"
              startIcon={importing ? <CircularProgress size={13} color="inherit" /> : <FileUploadOutlined />}
              onClick={handleImportClick}
              disabled={importing}
              sx={{ height: 34, fontSize: 12, borderColor: '#534AB7', color: '#534AB7' }}
            >
              Import
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlined />}
            onClick={() => navigate('/leads/new')}
            sx={{ height: 34 }}
          >
            New Lead
          </Button>
        </Box>
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

      <ImportResultDialog
        open={!!importResult}
        result={importResult}
        onClose={() => setImportResult(null)}
      />
    </PageWrapper>
  );
}
