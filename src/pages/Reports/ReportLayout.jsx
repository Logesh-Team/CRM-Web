import React from 'react';
import {
  Box, Card, CardContent, Typography, Button, CircularProgress,
} from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axiosInstance from '../../api/axiosInstance';
import PageWrapper from '../../components/common/PageWrapper';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportLayout({
  title,
  description,
  reportKey,
  filterBar,
  onGenerate,
  loading,
  hasData,
  exportParams,
  exportCols,
  exportRows,
  children,
}) {
  const handleExportExcel = () => {
    if (!exportRows || exportRows.length === 0) {
      toast.error('Generate the report first');
      return;
    }
    const headers = exportCols.map(c => c.header);
    const rows = exportRows.map(row => exportCols.map(c => {
      const val = row[c.field];
      return val != null ? val : '';
    }));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportKey}-report.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!exportRows || exportRows.length === 0) {
      toast.error('Generate the report first');
      return;
    }
    try {
      const res = await axiosInstance.get(`/reports/${reportKey}`, {
        params: { ...exportParams, format: 'pdf' },
        responseType: 'blob',
      });
      triggerDownload(new Blob([res.data], { type: 'application/pdf' }), `${reportKey}-report.pdf`);
    } catch {
      toast.error('PDF export failed');
    }
  };

  return (
    <PageWrapper title={title}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1A1A18' }}>{title}</Typography>
            {description && (
              <Typography sx={{ fontSize: 13, color: '#5A5A56', mt: 0.25 }}>{description}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={handleExportExcel}
              sx={{ fontSize: 12, borderColor: '#E3E1DA', color: '#5A5A56' }}
            >
              Export Excel
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={handleExportPDF}
              sx={{ fontSize: 12, borderColor: '#E3E1DA', color: '#5A5A56' }}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Filter card */}
      <Card sx={{ mb: 2, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {filterBar}
            <Button
              variant="contained"
              size="small"
              onClick={onGenerate}
              disabled={loading}
              sx={{ minWidth: 130, fontSize: 12 }}
            >
              {loading && <CircularProgress size={14} color="inherit" sx={{ mr: 0.75 }} />}
              Generate Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton rows={8} cols={5} />
      ) : !hasData ? (
        <EmptyState message="No report data. Apply filters and click Generate Report." />
      ) : (
        <>{children}</>
      )}
    </PageWrapper>
  );
}
