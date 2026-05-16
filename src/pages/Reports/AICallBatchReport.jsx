import React, { useState } from 'react';
import {
  Card, CardContent, Typography, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import ReportLayout from './ReportLayout';

const HEADER_SX = {
  fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.04em', whiteSpace: 'nowrap',
};
const CELL_SX = { fontSize: 13, color: '#1A1A18' };

export default function AICallBatchReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(true);
    axiosInstance
      .get('/reports/ai-call-batch', {
        params: {
          ...(dateFrom && { dateFrom }),
          ...(dateTo   && { dateTo }),
        },
      })
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.content || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const exportCols = [
    { header: 'Batch Name',         field: 'batchName' },
    { header: 'Date',               field: 'date' },
    { header: 'Total',              field: 'total' },
    { header: 'Interested',         field: 'interested' },
    { header: 'Not Interested',     field: 'notInterested' },
    { header: 'No Answer',          field: 'noAnswer' },
    { header: 'Callback Requested', field: 'callbackRequested' },
    { header: 'Interest Rate %',    field: 'ratePercent' },
  ];

  const exportParams = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo }),
  };

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
    </>
  );

  return (
    <ReportLayout
      title="AI Call Batch Report"
      description="Outcomes of AI call batches including interest rates and callback requests."
      reportKey="ai-call-batch"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      loading={loading}
      hasData={generated && data.length > 0}
      exportCols={exportCols}
      exportRows={data}
      exportParams={exportParams}
    >
      {/* Stacked BarChart */}
      <Card sx={{ mb: 2, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', mb: 1.5 }}>
            Call Outcomes per Batch
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="interested"        name="Interested"       fill="#3B6D11" stackId="a" />
              <Bar dataKey="notInterested"     name="Not Interested"   fill="#A32D2D" stackId="a" />
              <Bar dataKey="noAnswer"          name="No Answer"        fill="#5A5A56" stackId="a" />
              <Bar dataKey="callbackRequested" name="Callback Req."    fill="#BA7517" stackId="a" radius={[4, 4, 0, 0]} />
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
                {['Batch Name', 'Date', 'Total', 'Interested', 'Not Interested', 'No Answer', 'Callback Req.', 'Rate %'].map(h => (
                  <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                  <TableCell sx={{ ...CELL_SX, fontWeight: 500 }}>{row.batchName || '—'}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', fontSize: 12, color: '#5A5A56' }}>{row.date || '—'}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono' }}>{row.total ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', color: '#3B6D11', fontWeight: 600 }}>{row.interested ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', color: '#A32D2D' }}>{row.notInterested ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', color: '#5A5A56' }}>{row.noAnswer ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', color: '#BA7517' }}>{row.callbackRequested ?? 0}</TableCell>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono', fontWeight: 600 }}>
                    {row.ratePercent != null ? `${row.ratePercent}%` : '—'}
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
