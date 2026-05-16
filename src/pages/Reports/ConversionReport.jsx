import React, { useState } from 'react';
import {
  Card, CardContent, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import ReportLayout from './ReportLayout';

const SOURCES = ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'LINKEDIN', 'INDIAMART', 'TRADE_FAIR', 'AI_SEARCH', 'OTHER'];

const FUNNEL_BARS = [
  { key: 'leads',       label: 'Leads',       fill: '#185FA5' },
  { key: 'demos',       label: 'Demos',       fill: '#3B6D11' },
  { key: 'quotations',  label: 'Quotations',  fill: '#BA7517' },
  { key: 'orders',      label: 'Orders',      fill: '#534AB7' },
];

const HEADER_SX = {
  fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.04em', whiteSpace: 'nowrap',
};
const CELL_SX = { fontSize: 13, color: '#1A1A18' };

export default function ConversionReport() {
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [month, setMonth]         = useState('');
  const [source, setSource]       = useState('');
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(true);
    axiosInstance
      .get('/reports/conversions', {
        params: {
          ...(dateFrom  && { dateFrom }),
          ...(dateTo    && { dateTo }),
          ...(month     && { month }),
          ...(source    && { source }),
        },
      })
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.content || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  // Aggregate funnel totals across all rows
  const funnelData = FUNNEL_BARS.map(bar => ({
    name: bar.label,
    value: data.reduce((sum, row) => sum + (Number(row[bar.key]) || 0), 0),
    fill: bar.fill,
  }));

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
      <TextField
        size="small" label="Month" type="month" value={month}
        onChange={e => setMonth(e.target.value)}
        InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Source</InputLabel>
        <Select value={source} onChange={e => setSource(e.target.value)} label="Source">
          <MenuItem value="" sx={{ fontSize: 13 }}>All Sources</MenuItem>
          {SOURCES.map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  return (
    <ReportLayout
      title="Conversion Report"
      description="Lead-to-order conversion funnel by source, salesperson, and region."
      reportKey="conversion"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      loading={loading}
      hasData={generated && data.length > 0}
    >
      {/* Funnel Chart */}
      <Card sx={{ mb: 2, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', mb: 1.5 }}>
            Conversion Funnel Overview
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              layout="vertical"
              data={funnelData}
              margin={{ top: 4, right: 24, left: 60, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {funnelData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
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
                  'Source', 'Salesperson', 'Region', 'Leads', 'Demos',
                  'Quotations', 'Orders', 'Lead→Order %',
                ].map(h => (
                  <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                  <TableCell sx={CELL_SX}>{row.source || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{row.salesperson || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{row.region || '—'}</TableCell>
                  <TableCell sx={{ ...CELL_SX, color: '#185FA5', fontWeight: 600 }}>{row.leads ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, color: '#3B6D11', fontWeight: 600 }}>{row.demos ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, color: '#BA7517', fontWeight: 600 }}>{row.quotations ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, color: '#534AB7', fontWeight: 600 }}>{row.orders ?? 0}</TableCell>
                  <TableCell sx={CELL_SX}>
                    {row.conversionPct != null ? `${row.conversionPct}%` : '—'}
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
