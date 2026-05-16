import React, { useState } from 'react';
import {
  Card, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import axiosInstance from '../../api/axiosInstance';
import ReportLayout from './ReportLayout';
import { formatDateTime } from '../../utils/formatDate';

const ACTIVITY_TYPES = ['CALL', 'WHATSAPP', 'EMAIL', 'NOTE', 'STATUS_CHANGE', 'LEAD_CREATED', 'AI_CALL'];

const HEADER_SX = {
  fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.04em', cursor: 'pointer', userSelect: 'none',
  whiteSpace: 'nowrap',
};
const CELL_SX = { fontSize: 13, color: '#1A1A18' };

function SortIndicator({ field, sortField, sortDir }) {
  if (field !== sortField) return null;
  return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>;
}

const SORTABLE = ['performedAt', 'performedBy'];

export default function FollowUpActivityReport() {
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [actType, setActType]     = useState('');
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [generated, setGenerated] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir]     = useState('asc');

  const handleSort = (field) => {
    if (!SORTABLE.includes(field)) return;
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(true);
    axiosInstance
      .get('/reports/followup-activity', {
        params: {
          ...(dateFrom  && { dateFrom }),
          ...(dateTo    && { dateTo }),
          ...(actType   && { activityType: actType }),
        },
      })
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.content || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortField) return 0;
    const va = a[sortField] ?? '';
    const vb = b[sortField] ?? '';
    const cmp = String(va).localeCompare(String(vb));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const filterBar = (
    <>
      <TextField
        size="small" label="From" type="date" value={dateFrom}
        onChange={e => setDateFrom(e.target.value)}
        InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }}
      />
      <TextField
        size="small" label="To" type="date" value={dateTo}
        onChange={e => setDateTo(e.target.value)}
        InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }}
      />
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Activity Type</InputLabel>
        <Select value={actType} onChange={e => setActType(e.target.value)} label="Activity Type">
          <MenuItem value="" sx={{ fontSize: 13 }}>All Types</MenuItem>
          {ACTIVITY_TYPES.map(t => (
            <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t.replace(/_/g, ' ')}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  const columns = [
    { label: 'Date / Time',    field: 'performedAt',    sortable: true },
    { label: 'Sales Exec',     field: 'performedBy',    sortable: true },
    { label: 'Company',        field: 'companyName',    sortable: false },
    { label: 'Activity Type',  field: 'activityType',   sortable: false },
    { label: 'Summary',        field: 'summary',        sortable: false },
    { label: 'Duration (min)', field: 'durationMinutes', sortable: false },
    { label: 'Outcome',        field: 'outcome',        sortable: false },
  ];

  const exportCols = [
    { header: 'Date / Time',    field: 'performedAt' },
    { header: 'Sales Exec',     field: 'performedBy' },
    { header: 'Company',        field: 'companyName' },
    { header: 'Activity Type',  field: 'activityType' },
    { header: 'Summary',        field: 'summary' },
    { header: 'Duration (min)', field: 'durationMinutes' },
    { header: 'Outcome',        field: 'outcome' },
  ];

  const exportParams = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo }),
    ...(actType  && { activityType: actType }),
  };

  return (
    <ReportLayout
      title="Follow-Up Activity Report"
      description="All follow-up activities by sales executives in the selected date range."
      reportKey="followup-activity"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      loading={loading}
      hasData={generated && data.length > 0}
      exportCols={exportCols}
      exportRows={sorted}
      exportParams={exportParams}
    >
      <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#F7F6F3' }}>
                {columns.map(col => (
                  <TableCell
                    key={col.field}
                    sx={{ ...HEADER_SX, cursor: col.sortable ? 'pointer' : 'default' }}
                    onClick={() => col.sortable && handleSort(col.field)}
                  >
                    {col.label}
                    {col.sortable && (
                      <SortIndicator field={col.field} sortField={sortField} sortDir={sortDir} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((row, i) => (
                <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                  <TableCell sx={{ ...CELL_SX, fontSize: 11, color: '#5A5A56' }}>
                    {row.performedAt ? formatDateTime(row.performedAt) : '—'}
                  </TableCell>
                  <TableCell sx={CELL_SX}>{row.performedBy || '—'}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontWeight: 500 }}>{row.companyName || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                      padding: '2px 8px', fontSize: 11, fontWeight: 600,
                      background: '#E6F1FB', color: '#185FA5',
                    }}>
                      {row.activityType ? row.activityType.replace(/_/g, ' ') : '—'}
                    </span>
                  </TableCell>
                  <TableCell sx={{ ...CELL_SX, maxWidth: 200 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {row.summary || '—'}
                    </span>
                  </TableCell>
                  <TableCell sx={CELL_SX}>{row.durationMinutes ?? '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{row.outcome || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </ReportLayout>
  );
}
