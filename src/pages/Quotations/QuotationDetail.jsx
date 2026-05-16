import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Grid, Button, IconButton,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  CircularProgress, Alert, Tooltip,
} from '@mui/material';
import {
  EditOutlined, ArrowBackOutlined, EmailOutlined, ChatOutlined,
  PictureAsPdfOutlined, ContentCopyOutlined, CheckCircleOutlined,
  CancelOutlined, CalendarMonthOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  fetchQuotationById, submitQuotationApproval, sendQuotationEmail,
  sendQuotationWhatsApp, reviseQuotation, updateLeadResponse,
} from '../../features/quotations/quotationsSlice';
import axiosInstance from '../../api/axiosInstance';
import { QUOTATIONS } from '../../api/endpoints';
import { usePermission } from '../../hooks/usePermission';
import PageWrapper from '../../components/common/PageWrapper';
import ApiErrorAlert from '../../components/common/ApiErrorAlert';
import { formatDateTime, timeAgo } from '../../utils/formatDate';
import { formatINR } from '../../utils/formatCurrency';
import { QuotationStatusBadge } from './QuotationList';

const LEAD_RESPONSES = ['ACCEPTED', 'REJECTED', 'NEGOTIATING', 'NO_RESPONSE'];

function FieldItem({ label, value, mono }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, color: '#1A1A18', fontFamily: mono ? 'DM Mono' : 'DM Sans', wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

function ApprovalDialog({ open, decision, quotationId, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((s) => s.quotations);
  const [remarks, setRemarks] = useState('');

  const handleConfirm = async () => {
    const result = await dispatch(submitQuotationApproval({ id: quotationId, decision, remarks }));
    if (submitQuotationApproval.fulfilled.match(result)) {
      onSuccess();
      onClose();
    } else {
      toast.error(result.payload || 'Failed to process approval');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>
        {decision === 'APPROVED' ? 'Approve Quotation' : 'Reject Quotation'}
      </DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <Alert severity={decision === 'APPROVED' ? 'success' : 'error'} sx={{ mb: 2, borderRadius: '8px', fontSize: 12 }}>
          {decision === 'APPROVED'
            ? 'Approving will allow this quotation to be sent to the client.'
            : 'Rejecting will notify the sales executive to revise the quotation.'}
        </Alert>
        <TextField size="small" fullWidth multiline rows={3} label="Remarks (optional)"
          value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit" disabled={actionLoading}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" size="small" disabled={actionLoading}
          sx={{
            background: decision === 'APPROVED' ? '#3B6D11' : '#A32D2D',
            '&:hover': { background: decision === 'APPROVED' ? '#2d5409' : '#832424' },
          }}>
          {actionLoading ? <CircularProgress size={15} color="inherit" /> : (decision === 'APPROVED' ? 'Approve' : 'Reject')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SendEmailDialog({ open, quotation, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((s) => s.quotations);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (open && quotation) {
      setSubject(`Quotation ${quotation.quotationNumber} from Craviq CRM`);
      setBody(`Dear ${quotation.leadCompanyName || 'Sir/Madam'},\n\nPlease find attached quotation ${quotation.quotationNumber} for your reference.\n\nValid until: ${quotation.validityDays} days from date of issue.\n\nPlease feel free to reach out for any queries.\n\nBest regards`);
    }
  }, [open, quotation]);

  const handleSend = async () => {
    const result = await dispatch(sendQuotationEmail({ id: quotation.id, subject, body }));
    if (sendQuotationEmail.fulfilled.match(result)) {
      onSuccess();
      onClose();
    } else {
      toast.error(result.payload || 'Failed to send email');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>Send via Email</DialogTitle>
      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField size="small" fullWidth label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <TextField size="small" fullWidth multiline rows={6} label="Message Body"
          value={body} onChange={(e) => setBody(e.target.value)}
          inputProps={{ style: { fontSize: 12, fontFamily: 'DM Sans' } }} />
        <Alert severity="info" sx={{ fontSize: 11, borderRadius: '8px' }}>
          The PDF will be automatically attached to this email.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit" disabled={actionLoading}>Cancel</Button>
        <Button onClick={handleSend} variant="contained" size="small" disabled={actionLoading || !subject}
          startIcon={actionLoading ? <CircularProgress size={14} color="inherit" /> : <EmailOutlined />}>
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SendWhatsAppDialog({ open, quotation, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((s) => s.quotations);

  const previewMsg = quotation
    ? `Hi ${quotation.leadCompanyName || ''},\n\nYour quotation *${quotation.quotationNumber}* is ready!\n\n📋 Grand Total: *${formatINR(quotation.grandTotal)}*\n✅ Valid for: ${quotation.validityDays} days\n\nPlease find the PDF attachment for full details.\n\nLooking forward to your response! 🙏`
    : '';

  const handleSend = async () => {
    const result = await dispatch(sendQuotationWhatsApp(quotation.id));
    if (sendQuotationWhatsApp.fulfilled.match(result)) {
      onSuccess();
      onClose();
    } else {
      toast.error(result.payload || 'Failed to send WhatsApp message');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>Send via WhatsApp</DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <Typography sx={{ fontSize: 11, color: '#5A5A56', mb: 1.5 }}>Message preview:</Typography>
        <Box sx={{ background: '#E1F5EE', border: '1px solid #B5D98C', borderRadius: '10px', p: 2, mb: 1.5 }}>
          <Typography sx={{ fontSize: 12, fontFamily: 'DM Sans', whiteSpace: 'pre-wrap', color: '#1A1A18' }}>
            {previewMsg}
          </Typography>
        </Box>
        <Alert severity="info" sx={{ fontSize: 11, borderRadius: '8px' }}>
          PDF quotation will be sent as a separate attachment.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit" disabled={actionLoading}>Cancel</Button>
        <Button onClick={handleSend} variant="contained" size="small" disabled={actionLoading}
          sx={{ background: '#3B6D11', '&:hover': { background: '#2d5409' } }}
          startIcon={actionLoading ? <CircularProgress size={14} color="inherit" /> : <ChatOutlined />}>
          Send WhatsApp
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isManager, isSuperAdmin } = usePermission();
  const { selectedQuotation: q, loading, error, actionLoading } = useSelector((s) => s.quotations);

  const [approvalDialog, setApprovalDialog] = useState({ open: false, decision: '' });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [whatsappDialog, setWhatsappDialog] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [leadResponse, setLeadResponse] = useState('');
  const [responseUpdating, setResponseUpdating] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchQuotationById(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (q) {
      setLeadResponse(q.leadResponse || '');
      setFollowUpDate(q.followUpDate?.split('T')[0] || '');
    }
  }, [q]);

  const refresh = () => dispatch(fetchQuotationById(id));

  const handlePreviewPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await axiosInstance.get(QUOTATIONS.PREVIEW(id), { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error('Failed to load PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await axiosInstance.get(QUOTATIONS.DOWNLOAD(id), { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${q.quotationNumber}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRevise = async () => {
    const result = await dispatch(reviseQuotation(id));
    if (reviseQuotation.fulfilled.match(result)) {
      navigate(`/quotations/${result.payload.id}/edit`);
    } else {
      toast.error(result.payload || 'Failed to create revision');
    }
  };

  const handleSaveResponse = async () => {
    setResponseUpdating(true);
    const result = await dispatch(updateLeadResponse({ id, leadResponse, followUpDate }));
    setResponseUpdating(false);
    if (!updateLeadResponse.fulfilled.match(result)) {
      toast.error(result.payload || 'Failed to save response');
    }
  };

  if (loading && !q) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );
  if (error) return <ApiErrorAlert error={error} />;
  if (!q) return null;

  const canApprove = (isManager || isSuperAdmin) && q.status === 'PENDING_APPROVAL';
  const canSend    = ['APPROVED', 'SENT', 'VIEWED'].includes(q.status);
  const canRevise  = ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'].includes(q.status);
  const canEdit    = q.status === 'DRAFT';

  const autoFollowUp = q.sentAt
    ? new Date(new Date(q.sentAt).getTime() + 3 * 86400000).toISOString().split('T')[0]
    : null;

  return (
    <PageWrapper
      title={q.quotationNumber}
      breadcrumbs={[
        { label: 'Quotations', path: '/quotations' },
        ...(q.leadCompanyName ? [{ label: q.leadCompanyName, path: q.leadId ? `/leads/${q.leadId}` : undefined }] : []),
        { label: q.quotationNumber },
      ]}
    >
      {/* Approval banner */}
      {q.status === 'PENDING_APPROVAL' && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: '10px', fontSize: 13 }}
          action={canApprove ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained"
                sx={{ background: '#3B6D11', '&:hover': { background: '#2d5409' }, fontSize: 11 }}
                startIcon={<CheckCircleOutlined sx={{ fontSize: 14 }} />}
                onClick={() => setApprovalDialog({ open: true, decision: 'APPROVED' })}>
                Approve
              </Button>
              <Button size="small" variant="contained"
                sx={{ background: '#A32D2D', '&:hover': { background: '#832424' }, fontSize: 11 }}
                startIcon={<CancelOutlined sx={{ fontSize: 14 }} />}
                onClick={() => setApprovalDialog({ open: true, decision: 'REJECTED' })}>
                Reject
              </Button>
            </Box>
          ) : null}
        >
          Awaiting Manager Approval — this quotation exceeds the approval threshold and requires a manager to review before dispatch.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2.5 }}>
        {/* Left column */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {/* Main info card */}
          <Card>
            <CardContent sx={{ p: '20px 24px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, fontFamily: 'DM Mono', color: '#1A1A18' }}>
                    {q.quotationNumber}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#5A5A56', mt: 0.5 }}>{q.leadCompanyName || '—'}</Typography>
                </Box>
                <QuotationStatusBadge status={q.status} />
              </Box>

              <Grid container spacing={2.5}>
                {[
                  { label: 'Quotation Number', value: q.quotationNumber, mono: true },
                  { label: 'Lead / Company', value: q.leadCompanyName },
                  { label: 'Quotation Date', value: formatDateTime(q.quotationDate || q.createdAt) },
                  { label: 'Validity Period', value: q.validityDays ? `${q.validityDays} days` : '—' },
                  { label: 'Valid Until', value: q.validUntil ? formatDateTime(q.validUntil) : '—' },
                  { label: 'Payment Terms', value: q.paymentTerms?.replace('_', ' ') },
                  { label: 'Created By', value: q.createdByName },
                  { label: 'Created At', value: formatDateTime(q.createdAt) },
                  { label: 'Version', value: q.version ? `v${q.version}` : 'v1' },
                ].map((f) => (
                  <Grid item xs={6} sm={4} key={f.label}>
                    <FieldItem {...f} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardContent sx={{ p: '20px 24px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Line Items</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 32 }}>#</TableCell>
                      <TableCell>Product / Module</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Disc %</TableCell>
                      <TableCell align="right">GST %</TableCell>
                      <TableCell align="right">Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(q.lineItems || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3, color: '#5A5A56', fontSize: 12, border: 'none' }}>
                          No line items
                        </TableCell>
                      </TableRow>
                    ) : (q.lineItems || []).map((item, i) => (
                      <TableRow key={item.id || i}>
                        <TableCell><Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#5A5A56' }}>{i + 1}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 12, fontWeight: 600 }}>{item.productName}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 11, color: '#5A5A56' }}>{item.description || '—'}</Typography></TableCell>
                        <TableCell align="right"><Typography sx={{ fontSize: 12, fontFamily: 'DM Mono' }}>{item.quantity}</Typography></TableCell>
                        <TableCell align="right"><Typography sx={{ fontSize: 12, fontFamily: 'DM Mono' }}>{formatINR(item.unitPrice)}</Typography></TableCell>
                        <TableCell align="right"><Typography sx={{ fontSize: 12, fontFamily: 'DM Mono' }}>{item.discountPercent}%</Typography></TableCell>
                        <TableCell align="right"><Typography sx={{ fontSize: 12, fontFamily: 'DM Mono' }}>{item.gstPercent}%</Typography></TableCell>
                        <TableCell align="right"><Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', fontWeight: 600 }}>{formatINR(item.lineTotal)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Box sx={{ width: 280, background: '#F7F6F3', border: '1px solid #E3E1DA', borderRadius: '8px', p: 2 }}>
                  {[
                    { label: 'Subtotal', value: q.subtotal },
                    { label: 'Discount (−)', value: q.totalDiscount, color: '#A32D2D' },
                    { label: 'GST (+)', value: q.totalGst, color: '#185FA5' },
                  ].map((r) => (
                    <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: r.color || '#5A5A56' }}>{r.label}</Typography>
                      <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', color: r.color || '#1A1A18' }}>{formatINR(r.value)}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Grand Total</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono' }}>{formatINR(q.grandTotal)}</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          {q.termsAndConditions && (
            <Card>
              <CardContent sx={{ p: '20px 24px' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Terms & Conditions</Typography>
                <Typography sx={{ fontSize: 12, color: '#5A5A56', whiteSpace: 'pre-wrap', fontFamily: 'DM Sans' }}>
                  {q.termsAndConditions}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Tracking */}
          <Card>
            <CardContent sx={{ p: '20px 24px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Tracking & Response</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={4}><FieldItem label="Sent Date" value={q.sentAt ? formatDateTime(q.sentAt) : '—'} /></Grid>
                <Grid item xs={6} sm={4}><FieldItem label="Viewed Date" value={q.viewedAt ? formatDateTime(q.viewedAt) : 'Not viewed'} /></Grid>
                <Grid item xs={6} sm={4}><FieldItem label="Sent To" value={q.sentToEmail || '—'} /></Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel sx={{ fontSize: 13 }}>Lead Response</InputLabel>
                  <Select label="Lead Response" value={leadResponse}
                    onChange={(e) => setLeadResponse(e.target.value)}
                    sx={{ fontSize: 13, height: 36 }}>
                    {LEAD_RESPONSES.map((r) => (
                      <MenuItem key={r} value={r}>{r.replace('_', ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button size="small" variant="outlined" onClick={handleSaveResponse} disabled={responseUpdating}
                  sx={{ height: 36, fontSize: 12, borderColor: '#E3E1DA', color: '#1A1A18' }}>
                  {responseUpdating ? <CircularProgress size={14} /> : 'Save Response'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Follow-up */}
          <Card sx={{ background: 'linear-gradient(135deg, #E6F1FB 0%, #F7F6F3 100%)', border: '1px solid #B8D4F0' }}>
            <CardContent sx={{ p: '16px 20px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CalendarMonthOutlined sx={{ fontSize: 16, color: '#185FA5' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#185FA5' }}>Follow-up Reminder</Typography>
              </Box>
              {autoFollowUp && (
                <Typography sx={{ fontSize: 12, color: '#5A5A56', mb: 1.5 }}>
                  Auto-set to 3 days after dispatch: <strong>{autoFollowUp}</strong>
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <TextField size="small" label="Follow-up Date" type="date" InputLabelProps={{ shrink: true }}
                  value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)}
                  sx={{ '& .MuiInputBase-root': { height: 36, fontSize: 13 } }} />
                <Button size="small" variant="outlined" onClick={handleSaveResponse} disabled={responseUpdating}
                  sx={{ height: 36, fontSize: 12, borderColor: '#185FA5', color: '#185FA5' }}>
                  Update
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right column */}
        <Box sx={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Actions card */}
          <Card>
            <CardContent sx={{ p: '16px 20px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" fullWidth size="small"
                  startIcon={pdfLoading ? <CircularProgress size={13} /> : <PictureAsPdfOutlined />}
                  onClick={handlePreviewPdf} disabled={pdfLoading}
                  sx={{ justifyContent: 'flex-start', fontSize: 12, borderColor: '#E3E1DA', color: '#1A1A18', height: 36 }}>
                  Preview PDF
                </Button>
                <Button variant="outlined" fullWidth size="small"
                  startIcon={pdfLoading ? <CircularProgress size={13} /> : <PictureAsPdfOutlined />}
                  onClick={handleDownloadPdf} disabled={pdfLoading}
                  sx={{ justifyContent: 'flex-start', fontSize: 12, borderColor: '#185FA5', color: '#185FA5', height: 36 }}>
                  Download PDF
                </Button>

                {canEdit && (
                  <Button variant="outlined" fullWidth size="small" startIcon={<EditOutlined />}
                    onClick={() => navigate(`/quotations/${id}/edit`)}
                    sx={{ justifyContent: 'flex-start', fontSize: 12, borderColor: '#534AB7', color: '#534AB7', height: 36 }}>
                    Edit Draft
                  </Button>
                )}

                {canSend && (
                  <>
                    <Button variant="outlined" fullWidth size="small" startIcon={<EmailOutlined />}
                      onClick={() => setEmailDialog(true)}
                      sx={{ justifyContent: 'flex-start', fontSize: 12, borderColor: '#185FA5', color: '#185FA5', height: 36 }}>
                      Send via Email
                    </Button>
                    <Button variant="outlined" fullWidth size="small" startIcon={<ChatOutlined />}
                      onClick={() => setWhatsappDialog(true)}
                      sx={{ justifyContent: 'flex-start', fontSize: 12, borderColor: '#3B6D11', color: '#3B6D11', height: 36 }}>
                      Send via WhatsApp
                    </Button>
                  </>
                )}

                {canRevise && (
                  <Button variant="outlined" fullWidth size="small" startIcon={<ContentCopyOutlined />}
                    onClick={handleRevise} disabled={actionLoading}
                    sx={{ justifyContent: 'flex-start', fontSize: 12, borderColor: '#BA7517', color: '#BA7517', height: 36 }}>
                    {actionLoading ? <CircularProgress size={14} /> : 'Create Revision'}
                  </Button>
                )}

                <Divider sx={{ my: 0.5 }} />

                <Button variant="outlined" fullWidth size="small" startIcon={<ArrowBackOutlined />}
                  onClick={() => navigate(q.leadId ? `/leads/${q.leadId}` : '/quotations')}
                  sx={{ justifyContent: 'flex-start', fontSize: 12, borderColor: '#E3E1DA', color: '#5A5A56', height: 36 }}>
                  Back to {q.leadCompanyName ? 'Lead' : 'Quotations'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Version History */}
          {q.versions?.length > 0 && (
            <Card>
              <CardContent sx={{ p: '16px 20px' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Version History</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {q.versions.map((v, i) => (
                    <Box key={v.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1,
                      background: '#F7F6F3', border: '1px solid #E3E1DA', borderRadius: '8px', p: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, fontFamily: 'DM Mono' }}>v{v.version || i + 1}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#5A5A56' }}>{formatDateTime(v.createdAt)}</Typography>
                      </Box>
                      <QuotationStatusBadge status={v.status || 'ARCHIVED'} />
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/quotations/${v.id}`)}>
                          <ArrowBackOutlined sx={{ fontSize: 13, transform: 'rotate(180deg)' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Approval History */}
          {q.approvalRemarks && (
            <Card>
              <CardContent sx={{ p: '16px 20px' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Approval Remarks</Typography>
                <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>{q.approvalRemarks}</Typography>
                {q.approvedByName && (
                  <Typography sx={{ fontSize: 10, color: '#5A5A56', mt: 0.5 }}>
                    by {q.approvedByName} · {timeAgo(q.approvedAt)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      <ApprovalDialog
        open={approvalDialog.open}
        decision={approvalDialog.decision}
        quotationId={id}
        onClose={() => setApprovalDialog({ open: false, decision: '' })}
        onSuccess={refresh}
      />
      <SendEmailDialog
        open={emailDialog}
        quotation={q}
        onClose={() => setEmailDialog(false)}
        onSuccess={refresh}
      />
      <SendWhatsAppDialog
        open={whatsappDialog}
        quotation={q}
        onClose={() => setWhatsappDialog(false)}
        onSuccess={refresh}
      />
    </PageWrapper>
  );
}
