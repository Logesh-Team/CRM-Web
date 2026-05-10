import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Card, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Pagination, IconButton, Collapse,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress,
} from '@mui/material';
import { ExpandMoreOutlined, ExpandLessOutlined, RefreshOutlined } from '@mui/icons-material';
import { fetchAuditLogs } from '../features/users/usersSlice';
import PageWrapper from '../components/common/PageWrapper';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import { formatDateTime, timeAgo } from '../utils/formatDate';
import { getAuditActionColor, formatAuditAction } from '../utils/auditUtils';

const ACTION_TYPES = ['USER_CREATED','USER_DELETED','USER_UPDATED','ROLE_CHANGED','PASSWORD_CHANGED','STATUS_CHANGED','USER_ACTIVATED','USER_DEACTIVATED'];

export default function AuditLogsPage() {
  const dispatch = useDispatch();
  const { auditLogs, auditLoading, auditPagination, error } = useSelector((s) => s.users);

  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({ action: '', entityType: '', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(0);

  const load = useCallback(() => {
    dispatch(fetchAuditLogs({
      page,
      size: auditPagination.size,
      ...(filters.action && { action: filters.action }),
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
    }));
  }, [dispatch, page, filters, auditPagination.size]);

  useEffect(() => { load(); }, [load]);

  const handleReset = () => { setFilters({ action: '', entityType: '', dateFrom: '', dateTo: '' }); setPage(0); };

  return (
    <PageWrapper title="Audit Logs">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Audit Logs</Typography>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: '12px 16px', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: 13 }}>Action Type</InputLabel>
            <Select label="Action Type" value={filters.action} sx={{ fontSize: 13, height: 36 }}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}>
              <MenuItem value="">All Actions</MenuItem>
              {ACTION_TYPES.map((a) => <MenuItem key={a} value={a}>{formatAuditAction(a)}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField size="small" label="Entity Type" value={filters.entityType}
            onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))}
            sx={{ '& .MuiInputBase-root': { height: 36, fontSize: 13 }, width: 140 }} />

          <TextField size="small" label="From" type="date" InputLabelProps={{ shrink: true }}
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            sx={{ '& .MuiInputBase-root': { height: 36, fontSize: 13 } }} />

          <TextField size="small" label="To" type="date" InputLabelProps={{ shrink: true }}
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            sx={{ '& .MuiInputBase-root': { height: 36, fontSize: 13 } }} />

          <Button variant="outlined" size="small" startIcon={<RefreshOutlined />} onClick={handleReset}
            sx={{ height: 36, color: '#5A5A56', borderColor: '#E3E1DA' }}>
            Reset
          </Button>
        </Box>
      </Card>

      <Card>
        {auditLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Performed At</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity Type</TableCell>
                  <TableCell>Entity ID</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ border: 'none', py: 6, textAlign: 'center', color: '#5A5A56', fontSize: 13 }}>
                      No audit records found
                    </TableCell>
                  </TableRow>
                ) : auditLogs.map((log, i) => {
                  const col = getAuditActionColor(log.action);
                  const isExpanded = expandedRow === (log.id || i);
                  return (
                    <React.Fragment key={log.id || i}>
                      <TableRow sx={{ '&:hover': { background: '#F7F6F3' } }}>
                        <TableCell>
                          <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono' }}>
                            {formatDateTime(log.performedAt || log.createdAt)}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: '#5A5A56' }}>
                            {timeAgo(log.performedAt || log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{log.actorName || log.performedByName || '—'}</Typography>
                          {log.actorEmail && <Typography sx={{ fontSize: 10, color: '#5A5A56' }}>{log.actorEmail}</Typography>}
                        </TableCell>
                        <TableCell>
                          <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                            padding: '2px 8px', fontSize: 10, fontWeight: 600,
                            background: col.bg, color: col.text }}>
                            {formatAuditAction(log.action)}
                          </span>
                        </TableCell>
                        <TableCell><Typography sx={{ fontSize: 12 }}>{log.entityType || '—'}</Typography></TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#185FA5' }}>
                            {log.entityId || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#5A5A56' }}>
                            {log.ipAddress || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {(log.oldValue || log.newValue || log.details) && (
                            <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : (log.id || i))}>
                              {isExpanded ? <ExpandLessOutlined sx={{ fontSize: 16 }} /> : <ExpandMoreOutlined sx={{ fontSize: 16 }} />}
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded details */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ background: '#FAFAF9', py: 0 }}>
                            <Collapse in={isExpanded}>
                              <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
                                {log.oldValue && (
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#A32D2D', mb: 0.75, textTransform: 'uppercase' }}>
                                      Before
                                    </Typography>
                                    <Box sx={{ background: '#FCEBEB', border: '1px solid #F0B8B8', borderRadius: '6px', p: 1.5 }}>
                                      <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                        {typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue, null, 2) : log.oldValue}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                                {log.newValue && (
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#3B6D11', mb: 0.75, textTransform: 'uppercase' }}>
                                      After
                                    </Typography>
                                    <Box sx={{ background: '#EAF3DE', border: '1px solid #B5D98C', borderRadius: '6px', p: 1.5 }}>
                                      <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                        {typeof log.newValue === 'object' ? JSON.stringify(log.newValue, null, 2) : log.newValue}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                                {log.details && !log.oldValue && !log.newValue && (
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#5A5A56' }}>
                                      {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {auditPagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #F0EEE9' }}>
            <Pagination count={auditPagination.totalPages} page={page + 1}
              onChange={(_, p) => setPage(p - 1)} size="small" shape="rounded" />
          </Box>
        )}
      </Card>
    </PageWrapper>
  );
}
