import React, { useState } from 'react';
import {
  Card, CardContent, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Grid,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import axiosInstance from '../../api/axiosInstance';
import ReportLayout from './ReportLayout';
import { formatDate } from '../../utils/formatDate';

const STATUS_META = {
  SCHEDULED:  { label: 'Scheduled',  bg: '#E6F1FB', text: '#185FA5' },
  COMPLETED:  { label: 'Completed',  bg: '#EAF3DE', text: '#3B6D11' },
  NO_SHOW:    { label: 'No Show',    bg: '#FCEBEB', text: '#A32D2D' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || '—', bg: '#F0EEE9', text: '#5A5A56' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 999,
      padding: '2px 9px', fontSize: 11, fontWeight: 600,
      background: meta.bg, color: meta.text,
    }}>
      {meta.label}
    </span>
  );
}

const HEADER_SX = {
  fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.04em', whiteSpace: 'nowrap',
};
const CELL_SX = { fontSize: 13, color: '#1A1A18' };

export default function DemoPipelineReport() {
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [status, setStatus]       = useState('ALL');
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(true);
    axiosInstance
      .get('/reports/demo-pipeline', {
        params: {
          ...(dateFrom           && { dateFrom }),
          ...(dateTo             && { dateTo }),
          ...(status !== 'ALL'   && { status }),
        },
      })
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.content || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const scheduled = data.filter(r => r.status === 'SCHEDULED').length;
  const completed = data.filter(r => r.status === 'COMPLETED').length;
  const noShow    = data.filter(r => r.status === 'NO_SHOW').length;
  const noShowPct = data.length ? ((noShow / data.length) * 100).toFixed(1) : '0.0';

  const summaryCards = [
    { label: 'Scheduled',  value: scheduled, color: '#185FA5', bg: '#E6F1FB' },
    { label: 'Completed',  value: completed, color: '#3B6D11', bg: '#EAF3DE' },
    { label: 'No-Show',    value: noShow,    color: '#A32D2D', bg: '#FCEBEB' },
    { label: 'No-Show %',  value: `${noShowPct}%`, color: '#BA7517', bg: '#FAEEDA' },
  ];

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
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Status</InputLabel>
        <Select value={status} onChange={e => setStatus(e.target.value)} label="Status">
          {['ALL', 'SCHEDULED', 'COMPLETED', 'NO_SHOW'].map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  return (
    <ReportLayout
      title="Demo Pipeline Report"
      description="Status and outcomes of scheduled demo sessions."
      reportKey="demo-pipeline"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      loading={loading}
      hasData={generated && data.length > 0}
    >
      {/* Summary cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {summaryCards.map(card => (
          <Grid item xs={6} sm={3} key={card.label}>
            <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none', background: card.bg }}>
              <CardContent sx={{ p: '16px 20px !important' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: card.color, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: card.color }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#F7F6F3' }}>
                {['Lead Name', 'Scheduled Date', 'Time', 'Assigned To', 'Status', 'Feedback'].map(h => (
                  <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                  <TableCell sx={{ ...CELL_SX, fontWeight: 500 }}>{row.leadName || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{formatDate(row.scheduledDate)}</TableCell>
                  <TableCell sx={CELL_SX}>{row.time || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{row.assignedTo || '—'}</TableCell>
                  <TableCell sx={CELL_SX}><StatusBadge status={row.status} /></TableCell>
                  <TableCell sx={{ ...CELL_SX, maxWidth: 200 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {row.feedback || '—'}
                    </span>
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
