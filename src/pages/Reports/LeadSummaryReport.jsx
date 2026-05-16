import React, { useState } from 'react';
import {
  Card, CardContent, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import ReportLayout from './ReportLayout';
import { formatDateTime } from '../../utils/formatDate';
import { formatINR } from '../../utils/formatCurrency';

const SOURCES = [
  { v: 'WEBSITE',    l: 'Website' },
  { v: 'REFERRAL',   l: 'Referral' },
  { v: 'COLD_CALL',  l: 'Cold Call' },
  { v: 'LINKEDIN',   l: 'LinkedIn' },
  { v: 'INDIAMART',  l: 'IndiaMart' },
  { v: 'TRADE_FAIR', l: 'Trade Fair' },
  { v: 'CAMPAIGN',   l: 'Campaign' },
  { v: 'AI_SEARCH',  l: 'AI Search' },
  { v: 'MANUAL',     l: 'Manual Entry' },
  { v: 'IMPORT',     l: 'Import' },
  { v: 'OTHER',      l: 'Other' },
];
const STATUSES = [
  'NEW', 'AI_CALL_SCHEDULED', 'AI_CALL_DONE_INTERESTED', 'AI_CALL_DONE_NOT_INTERESTED',
  'IN_FOLLOW_UP', 'DEMO_SCHEDULED', 'DEMO_DONE', 'QUOTATION_SENT',
  'NEGOTIATION', 'CONVERTED_WON', 'CLOSED_LOST', 'ON_HOLD',
];
const GRADES = ['A', 'B', 'C', 'D'];

const STATUS_COLORS = {
  NEW: '#185FA5', IN_FOLLOW_UP: '#534AB7', DEMO_SCHEDULED: '#BA7517',
  DEMO_DONE: '#3B6D11', QUOTATION_SENT: '#0F6E56', NEGOTIATION: '#7A3F91',
  CONVERTED_WON: '#3B6D11', CLOSED_LOST: '#A32D2D', ON_HOLD: '#5A5A56',
  AI_CALL_SCHEDULED: '#1B7FC4', AI_CALL_DONE_INTERESTED: '#2E8B57',
  AI_CALL_DONE_NOT_INTERESTED: '#CD5C5C',
};

const HEADER_SX = {
  fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.04em', whiteSpace: 'nowrap',
};
const CELL_SX = { fontSize: 13, color: '#1A1A18' };

export default function LeadSummaryReport() {
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [leadGrade, setLeadGrade]   = useState('');
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [generated, setGenerated]   = useState(false);
  const [sortField, setSortField]   = useState('');
  const [sortDir, setSortDir]       = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(true);
    axiosInstance
      .get('/reports/lead-summary', {
        params: {
          ...(dateFrom    && { dateFrom }),
          ...(dateTo      && { dateTo }),
          ...(leadStatus  && { leadStatus }),
          ...(leadSource  && { leadSource }),
          ...(leadGrade   && { leadGrade }),
        },
      })
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.content || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  // Aggregate by status for chart
  const chartData = Object.entries(
    data.reduce((acc, row) => {
      const key = row.leadStatus || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const sorted = [...data].sort((a, b) => {
    if (!sortField) return 0;
    const va = a[sortField] ?? '';
    const vb = b[sortField] ?? '';
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
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
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Status</InputLabel>
        <Select value={leadStatus} onChange={e => setLeadStatus(e.target.value)} label="Status">
          <MenuItem value="" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
          {STATUSES.map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s.replace(/_/g, ' ')}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Source</InputLabel>
        <Select value={leadSource} onChange={e => setLeadSource(e.target.value)} label="Source">
          <MenuItem value="" sx={{ fontSize: 13 }}>All Sources</MenuItem>
          {SOURCES.map(({ v, l }) => (
            <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{l}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel>Grade</InputLabel>
        <Select value={leadGrade} onChange={e => setLeadGrade(e.target.value)} label="Grade">
          <MenuItem value="" sx={{ fontSize: 13 }}>All Grades</MenuItem>
          {GRADES.map(g => (
            <MenuItem key={g} value={g} sx={{ fontSize: 13 }}>Grade {g}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  const exportCols = [
    { header: 'Company',     field: 'companyName' },
    { header: 'Contact',     field: 'primaryContactName' },
    { header: 'Source',      field: 'leadSource' },
    { header: 'Status',      field: 'leadStatus' },
    { header: 'Grade',       field: 'leadGrade' },
    { header: 'Assigned To', field: 'assignedTo' },
    { header: 'Deal Value',  field: 'estimatedDealValue' },
    { header: 'City',        field: 'city' },
    { header: 'Created',     field: 'createdAt' },
  ];

  const exportParams = {
    ...(dateFrom   && { dateFrom }),
    ...(dateTo     && { dateTo }),
    ...(leadStatus && { leadStatus }),
    ...(leadSource && { leadSource }),
    ...(leadGrade  && { leadGrade }),
  };

  return (
    <ReportLayout
      title="Lead Summary Report"
      description="All leads with status, source, grade, and deal value for the selected period."
      reportKey="lead-summary"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      loading={loading}
      hasData={generated && data.length > 0}
      exportCols={exportCols}
      exportRows={sorted}
      exportParams={exportParams}
    >
      {/* Chart — leads by status */}
      <Card sx={{ mb: 2, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', mb: 1.5 }}>
            Leads by Status
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE9" />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Leads']} />
              <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={STATUS_COLORS[entry.status] || '#185FA5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#F7F6F3' }}>
                {[
                  { label: 'Company',      field: 'companyName' },
                  { label: 'Contact',      field: 'primaryContactName' },
                  { label: 'Source',       field: 'leadSource' },
                  { label: 'Status',       field: 'leadStatus' },
                  { label: 'Grade',        field: 'leadGrade' },
                  { label: 'Assigned To',  field: 'assignedTo' },
                  { label: 'Deal Value',   field: 'estimatedDealValue' },
                  { label: 'City',         field: 'city' },
                  { label: 'Created',      field: 'createdAt' },
                ].map(col => (
                  <TableCell
                    key={col.field} sx={{ ...HEADER_SX, cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort(col.field)}
                  >
                    {col.label}
                    {sortField === col.field && (
                      <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((row, i) => (
                <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                  <TableCell sx={{ ...CELL_SX, fontWeight: 600 }}>{row.companyName || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{row.primaryContactName || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{row.leadSource ? row.leadSource.replace(/_/g, ' ') : '—'}</TableCell>
                  <TableCell sx={CELL_SX}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11,
                      fontWeight: 600, background: '#E6F1FB',
                      color: STATUS_COLORS[row.leadStatus] || '#185FA5',
                    }}>
                      {row.leadStatus ? row.leadStatus.replace(/_/g, ' ') : '—'}
                    </span>
                  </TableCell>
                  <TableCell sx={{ ...CELL_SX, fontWeight: 600, color: '#534AB7' }}>
                    {row.leadGrade || '—'}
                  </TableCell>
                  <TableCell sx={CELL_SX}>{row.assignedTo || '—'}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', fontSize: 12 }}>
                    {row.estimatedDealValue != null ? formatINR(row.estimatedDealValue) : '—'}
                  </TableCell>
                  <TableCell sx={CELL_SX}>{row.city || '—'}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontSize: 11, color: '#5A5A56' }}>
                    {row.createdAt ? formatDateTime(row.createdAt) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </ReportLayout>
  );
}
