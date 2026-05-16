import React, { useState } from 'react';
import {
  Card, TextField, Select, MenuItem,
  FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import axiosInstance from '../../api/axiosInstance';
import ReportLayout from './ReportLayout';
import { formatDate } from '../../utils/formatDate';
import { formatINR } from '../../utils/formatCurrency';

const STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'];

const STATUS_META = {
  DRAFT:            { label: 'Draft',            bg: '#F0EEE9', text: '#5A5A56' },
  PENDING_APPROVAL: { label: 'Pending Approval', bg: '#FAEEDA', text: '#BA7517' },
  APPROVED:         { label: 'Approved',          bg: '#E6F1FB', text: '#185FA5' },
  SENT:             { label: 'Sent',              bg: '#EEEDFE', text: '#534AB7' },
  VIEWED:           { label: 'Viewed',            bg: '#E1F5EE', text: '#0F6E56' },
  ACCEPTED:         { label: 'Accepted',          bg: '#EAF3DE', text: '#3B6D11' },
  REJECTED:         { label: 'Rejected',          bg: '#FCEBEB', text: '#A32D2D' },
};

function QStatusBadge({ status }) {
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

export default function QuotationStatusReport() {
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [quotationStatus, setQStatus]     = useState('');
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [generated, setGenerated]         = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(true);
    axiosInstance
      .get('/reports/quotation-status', {
        params: {
          ...(dateFrom         && { dateFrom }),
          ...(dateTo           && { dateTo }),
          ...(quotationStatus  && { quotationStatus }),
        },
      })
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.content || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const grandTotal = data.reduce((sum, row) => sum + (Number(row.grandTotal) || 0), 0);

  const exportCols = [
    { header: 'QT Number',     field: 'quotationNumber' },
    { header: 'Company',       field: 'companyName' },
    { header: 'Status',        field: 'status' },
    { header: 'Date',          field: 'quotationDate' },
    { header: 'Subtotal',      field: 'subtotal' },
    { header: 'Discount',      field: 'totalDiscount' },
    { header: 'GST',           field: 'totalGst' },
    { header: 'Grand Total',   field: 'grandTotal' },
    { header: 'Version',       field: 'versionNumber' },
    { header: 'Lead Response', field: 'leadResponse' },
    { header: 'Sent Date',     field: 'sentDate' },
    { header: 'Viewed Date',   field: 'viewedDate' },
    { header: 'Created At',    field: 'createdAt' },
  ];

  const exportParams = {
    ...(dateFrom        && { dateFrom }),
    ...(dateTo          && { dateTo }),
    ...(quotationStatus && { quotationStatus }),
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
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Status</InputLabel>
        <Select value={quotationStatus} onChange={e => setQStatus(e.target.value)} label="Status">
          <MenuItem value="" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
          {STATUSES.map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s.replace(/_/g, ' ')}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  return (
    <ReportLayout
      title="Quotation Status Report"
      description="Track the lifecycle of quotations from creation to acceptance or rejection."
      reportKey="quotation-status"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      loading={loading}
      hasData={generated && data.length > 0}
      exportCols={exportCols}
      exportRows={data}
      exportParams={exportParams}
    >
      <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#F7F6F3' }}>
                {['QT Number', 'Company', 'Created', 'Sent', 'Viewed', 'Status', 'Grand Total', 'Lead Response'].map(h => (
                  <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                  <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                    {row.quotationNumber || '—'}
                  </TableCell>
                  <TableCell sx={CELL_SX}>{row.companyName || '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{formatDate(row.createdAt)}</TableCell>
                  <TableCell sx={CELL_SX}>{row.sentDate ? formatDate(row.sentDate) : '—'}</TableCell>
                  <TableCell sx={CELL_SX}>{row.viewedDate ? formatDate(row.viewedDate) : '—'}</TableCell>
                  <TableCell sx={CELL_SX}><QStatusBadge status={row.status} /></TableCell>
                  <TableCell sx={{ ...CELL_SX, textAlign: 'right' }}>{formatINR(row.grandTotal)}</TableCell>
                  <TableCell sx={CELL_SX}>
                    {row.leadResponse
                      ? <span style={{
                          display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                          padding: '2px 8px', fontSize: 11, fontWeight: 600,
                          background: '#F0EEE9', color: '#5A5A56',
                        }}>
                          {row.leadResponse.replace(/_/g, ' ')}
                        </span>
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ background: '#F7F6F3' }}>
                <TableCell colSpan={6} sx={{ fontSize: 12, fontWeight: 700, color: '#1A1A18' }}>
                  Total
                </TableCell>
                <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#1A1A18', textAlign: 'right' }}>
                  {formatINR(grandTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </ReportLayout>
  );
}
