import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer, Pagination,
  FormControl, InputLabel, Select, MenuItem, TextField, IconButton,
  Tooltip,
} from '@mui/material';
import { AddOutlined, RefreshOutlined, VisibilityOutlined } from '@mui/icons-material';
import {
  fetchQuotations, setFilters, resetFilters, setPagination,
} from '../../features/quotations/quotationsSlice';
import PageWrapper from '../../components/common/PageWrapper';
import ApiErrorAlert from '../../components/common/ApiErrorAlert';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { formatDateTime } from '../../utils/formatDate';
import { formatINR } from '../../utils/formatCurrency';

export const QUOTATION_STATUS_META = {
  DRAFT:            { label: 'Draft',            bg: '#F0EEE9', text: '#5A5A56' },
  PENDING_APPROVAL: { label: 'Pending Approval', bg: '#FAEEDA', text: '#BA7517' },
  APPROVED:         { label: 'Approved',          bg: '#E6F1FB', text: '#185FA5' },
  SENT:             { label: 'Sent',              bg: '#EEEDFE', text: '#534AB7' },
  VIEWED:           { label: 'Viewed',            bg: '#E1F5EE', text: '#0F6E56' },
  ACCEPTED:         { label: 'Accepted',          bg: '#EAF3DE', text: '#3B6D11' },
  REJECTED:         { label: 'Rejected',          bg: '#FCEBEB', text: '#A32D2D' },
  ARCHIVED:         { label: 'Archived',          bg: '#F0EEE9', text: '#5A5A56' },
};

export function QuotationStatusBadge({ status }) {
  const meta = QUOTATION_STATUS_META[status] || { label: status || '—', bg: '#F0EEE9', text: '#5A5A56' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 999,
      padding: '2px 9px', fontSize: 10, fontWeight: 600,
      background: meta.bg, color: meta.text,
    }}>
      {meta.label}
    </span>
  );
}

export default function QuotationList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { quotations, loading, error, pagination, filters } = useSelector((s) => s.quotations);
  const [localFilters, setLocalFilters] = useState({ status: filters.status, dateFrom: filters.dateFrom, dateTo: filters.dateTo });

  const load = useCallback(() => {
    dispatch(fetchQuotations({
      page: pagination.page,
      size: pagination.size,
      ...(filters.status && { status: filters.status }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
    }));
  }, [dispatch, pagination.page, pagination.size, filters]);

  useEffect(() => { load(); }, [load]);

  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters));
  };

  const handleReset = () => {
    setLocalFilters({ status: '', dateFrom: '', dateTo: '' });
    dispatch(resetFilters());
  };

  const handlePage = (_, p) => dispatch(setPagination({ page: p - 1 }));

  const stats = [
    { label: 'Total', value: pagination.totalElements || quotations.length },
    { label: 'Pending Approval', value: quotations.filter((q) => q.status === 'PENDING_APPROVAL').length, color: '#BA7517' },
    { label: 'Approved', value: quotations.filter((q) => q.status === 'APPROVED').length, color: '#185FA5' },
    { label: 'Accepted', value: quotations.filter((q) => q.status === 'ACCEPTED').length, color: '#3B6D11' },
  ];

  return (
    <PageWrapper title="Quotations">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Quotations</Typography>
        <Button variant="contained" size="small" startIcon={<AddOutlined />}
          onClick={() => navigate('/quotations/create')}>
          New Quotation
        </Button>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {stats.map((s) => (
          <Card key={s.label} sx={{ flex: 1 }}>
            <CardContent sx={{ p: '12px 16px !important' }}>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 300, fontFamily: 'DM Mono', color: s.color || '#1A1A18', mt: 0.5 }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: '12px 16px !important' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
              <Select label="Status" value={localFilters.status} sx={{ fontSize: 13, height: 36 }}
                onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}>
                <MenuItem value="">All Statuses</MenuItem>
                {Object.entries(QUOTATION_STATUS_META).map(([val, meta]) => (
                  <MenuItem key={val} value={val}>{meta.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField size="small" label="From" type="date" InputLabelProps={{ shrink: true }}
              value={localFilters.dateFrom}
              onChange={(e) => setLocalFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              sx={{ '& .MuiInputBase-root': { height: 36, fontSize: 13 } }} />

            <TextField size="small" label="To" type="date" InputLabelProps={{ shrink: true }}
              value={localFilters.dateTo}
              onChange={(e) => setLocalFilters((f) => ({ ...f, dateTo: e.target.value }))}
              sx={{ '& .MuiInputBase-root': { height: 36, fontSize: 13 } }} />

            <Button variant="contained" size="small" onClick={handleApplyFilters}
              sx={{ height: 36 }}>
              Apply
            </Button>
            <Button variant="outlined" size="small" startIcon={<RefreshOutlined />} onClick={handleReset}
              sx={{ height: 36, color: '#5A5A56', borderColor: '#E3E1DA' }}>
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <Box sx={{ p: 2 }}><LoadingSkeleton rows={8} cols={7} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>QT Number</TableCell>
                  <TableCell>Lead / Company</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell align="right">Grand Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ border: 'none', py: 6, textAlign: 'center', color: '#5A5A56', fontSize: 13 }}>
                      No quotations found
                    </TableCell>
                  </TableRow>
                ) : quotations.map((q) => (
                  <TableRow key={q.id}
                    onClick={() => navigate(`/quotations/${q.id}`)}
                    sx={{ cursor: 'pointer', '&:hover': { background: '#F7F6F3' } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono', color: '#185FA5' }}>
                        {q.quotationNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{q.leadCompanyName || '—'}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>{q.leadContactName || ''}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono' }}>
                        {formatDateTime(q.quotationDate || q.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono' }}>
                        {q.validUntil ? formatDateTime(q.validUntil) : (q.validityDays ? `${q.validityDays} days` : '—')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono' }}>
                        {q.grandTotal != null ? formatINR(q.grandTotal) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell><QuotationStatusBadge status={q.status} /></TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/quotations/${q.id}`)}>
                          <VisibilityOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #F0EEE9' }}>
            <Pagination count={pagination.totalPages} page={pagination.page + 1}
              onChange={handlePage} size="small" shape="rounded" />
          </Box>
        )}
      </Card>
    </PageWrapper>
  );
}
