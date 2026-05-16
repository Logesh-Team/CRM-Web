import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, FormHelperText,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  IconButton, CircularProgress, Divider, Alert, Autocomplete,
} from '@mui/material';
import axiosInstance from '../../api/axiosInstance';
import { LEADS } from '../../api/endpoints';
import {
  AddOutlined, DeleteOutlined, SaveOutlined, SendOutlined,
  ArrowBackOutlined, PictureAsPdfOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  createQuotation, updateQuotation, fetchNextNumber, fetchQuotationById,
} from '../../features/quotations/quotationsSlice';
import { fetchLeadById } from '../../features/leads/leadsSlice';
import PageWrapper from '../../components/common/PageWrapper';
import ApiErrorAlert from '../../components/common/ApiErrorAlert';
import { formatINR } from '../../utils/formatCurrency';

const APPROVAL_THRESHOLD = 100000;

const PAYMENT_TERMS = [
  { value: 'ADVANCE', label: 'Full Advance' },
  { value: 'NET_15',  label: 'Net 15 Days' },
  { value: 'NET_30',  label: 'Net 30 Days' },
  { value: 'CUSTOM',  label: 'Custom' },
];

const DEFAULT_ITEM = { productName: '', description: '', qty: 1, unitPrice: 0, discountPercent: 0, gstPercent: 18 };

const schema = yup.object({
  quotationDate: yup.string().required('Date is required'),
  validityDays:  yup.number().typeError('Must be a number').positive('Must be positive').integer().required('Validity period is required'),
  paymentTerms:  yup.string().required('Payment terms are required'),
  termsAndConditions: yup.string(),
});

function calcLineTotal(item) {
  const qty  = Number(item.qty) || 0;
  const up   = Number(item.unitPrice) || 0;
  const disc = Number(item.discountPercent) || 0;
  const gst  = Number(item.gstPercent) || 0;
  return qty * up * (1 - disc / 100) * (1 + gst / 100);
}

function calcTotals(items = []) {
  let subtotal = 0, totalDiscount = 0, totalGst = 0;
  items.forEach((item) => {
    const qty  = Number(item.qty) || 0;
    const up   = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    const gst  = Number(item.gstPercent) || 0;
    const base     = qty * up;
    const discAmt  = base * disc / 100;
    const afterDisc = base - discAmt;
    const gstAmt   = afterDisc * gst / 100;
    subtotal      += base;
    totalDiscount += discAmt;
    totalGst      += gstAmt;
  });
  return { subtotal, totalDiscount, totalGst, grandTotal: subtotal - totalDiscount + totalGst };
}

function TotalRow({ label, value, bold, color }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Typography sx={{ fontSize: 12, color: color || '#5A5A56' }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', fontWeight: bold ? 700 : 400, color: color || '#1A1A18' }}>
        {formatINR(value)}
      </Typography>
    </Box>
  );
}

export default function CreateQuotation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEdit = !!id;

  const { selectedQuotation, nextNumber, actionLoading, error } = useSelector((s) => s.quotations);
  const { selectedLead } = useSelector((s) => s.leads);

  const [leadOption, setLeadOption] = useState(null);
  const [leadOptions, setLeadOptions] = useState([]);
  const [leadSearching, setLeadSearching] = useState(false);
  const [leadInputValue, setLeadInputValue] = useState('');
  const leadSearchTimer = useRef(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      quotationDate: new Date().toISOString().split('T')[0],
      validityDays: 30,
      paymentTerms: 'NET_30',
      termsAndConditions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const watchedItems = useWatch({ control, name: 'lineItems', defaultValue: [] });
  const totals = calcTotals(watchedItems);

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchQuotationById(id));
    } else {
      dispatch(fetchNextNumber());
      if (leadId) dispatch(fetchLeadById(leadId));
    }
  }, [id, leadId, isEdit, dispatch]);

  // Pre-populate lead option from Redux once it loads
  useEffect(() => {
    if (!isEdit && selectedLead && String(selectedLead.id) === String(leadId)) {
      setLeadOption(selectedLead);
      setLeadInputValue(selectedLead.companyName || '');
    }
  }, [selectedLead, leadId, isEdit]);

  const handleLeadInputChange = useCallback((_, value) => {
    setLeadInputValue(value);
    if (leadSearchTimer.current) clearTimeout(leadSearchTimer.current);
    if (!value || value.length < 2) { setLeadOptions([]); return; }
    leadSearchTimer.current = setTimeout(async () => {
      setLeadSearching(true);
      try {
        const res = await axiosInstance.get(LEADS.LIST, { params: { search: value, size: 15 } });
        const data = res.data?.data;
        const items = data?.content || (Array.isArray(data) ? data : []);
        setLeadOptions(items);
      } catch { /* silent */ }
      setLeadSearching(false);
    }, 400);
  }, []);

  // Bug fix: init lead autocomplete when editing — backend returns leadCompanyName not leadName/leadCompany
  useEffect(() => {
    if (isEdit && selectedQuotation) {
      setLeadOption({ id: selectedQuotation.leadId, companyName: selectedQuotation.leadCompanyName });
      setLeadInputValue(selectedQuotation.leadCompanyName || '');
    }
  }, [isEdit, selectedQuotation]);

  useEffect(() => {
    if (isEdit && selectedQuotation) {
      reset({
        quotationDate:      selectedQuotation.quotationDate?.split('T')[0] || '',
        validityDays:       selectedQuotation.validityDays || 30,
        paymentTerms:       selectedQuotation.paymentTerms || 'NET_30',
        termsAndConditions: selectedQuotation.termsAndConditions || '',
        // Bug fix: backend returns `quantity` but form fields use `qty` — map here
        lineItems: selectedQuotation.lineItems?.length
          ? selectedQuotation.lineItems.map((i) => ({
              productName:     i.productName || '',
              description:     i.description || '',
              qty:             i.quantity ?? i.qty ?? 1,
              unitPrice:       i.unitPrice ?? 0,
              discountPercent: i.discountPercent ?? 0,
              gstPercent:      i.gstPercent ?? 18,
            }))
          : [{ ...DEFAULT_ITEM }],
      });
    } else if (!isEdit && fields.length === 0) {
      append({ ...DEFAULT_ITEM });
    }
  }, [isEdit, selectedQuotation, reset, append, fields.length]);

  const buildPayload = useCallback((formData, status) => {
    const { subtotal, totalDiscount, totalGst, grandTotal } = calcTotals(formData.lineItems);
    return {
      ...formData,
      leadId:          leadOption?.id || selectedQuotation?.leadId,
      quotationNumber: isEdit ? selectedQuotation?.quotationNumber : nextNumber,
      status,
      subtotal,
      totalDiscount,
      totalGst,
      grandTotal,
    };
  }, [leadOption, selectedQuotation, nextNumber, isEdit]);

  const save = async (formData, status) => {
    const payload = buildPayload(formData, status);
    if (!payload.leadId) { toast.error('Lead reference is required'); return; }
    if (!formData.lineItems?.length) { toast.error('Add at least one line item'); return; }
    const emptyItem = formData.lineItems.find((i) => !i.productName?.trim());
    if (emptyItem) { toast.error('Product name is required on all line items'); return; }

    let result;
    if (isEdit) {
      result = await dispatch(updateQuotation({ id, data: payload }));
      if (updateQuotation.fulfilled.match(result)) navigate(`/quotations/${id}`);
    } else {
      result = await dispatch(createQuotation(payload));
      if (createQuotation.fulfilled.match(result)) navigate(`/quotations/${result.payload.id}`);
    }
    if (!result || (!updateQuotation.fulfilled.match(result) && !createQuotation.fulfilled.match(result))) {
      toast.error(result?.payload || 'Failed to save quotation');
    }
  };

  const handleDraft = handleSubmit((data) => save(data, 'DRAFT'));
  const handleSubmitForApproval = handleSubmit((data) => {
    const { grandTotal } = calcTotals(data.lineItems);
    const status = grandTotal > APPROVAL_THRESHOLD ? 'PENDING_APPROVAL' : 'APPROVED';
    save(data, status);
  });

  const handlePreview = () => {
    if (!isEdit) { toast.error('Save as draft first to preview the PDF'); return; }
    window.open(`/api/quotations/${id}/preview`, '_blank');
  };

  const leadDisplay = isEdit
    ? (selectedQuotation?.leadCompanyName || '—')
    : (leadOption?.companyName || '—');

  const qtNumber = isEdit ? (selectedQuotation?.quotationNumber || '') : (nextNumber || 'Auto-generated');

  const resolvedLeadId = leadOption?.id || leadId;
  const backPath = resolvedLeadId && !isEdit
    ? `/leads/${resolvedLeadId}`
    : isEdit
      ? `/quotations/${id}`
      : '/quotations';

  return (
    <PageWrapper
      title={isEdit ? 'Edit Quotation' : 'New Quotation'}
      breadcrumbs={[
        { label: 'Quotations', path: '/quotations' },
        ...(leadDisplay !== '—' ? [{ label: leadDisplay, path: leadId ? `/leads/${leadId}` : undefined }] : []),
        { label: isEdit ? 'Edit' : 'New Quotation' },
      ]}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
          {isEdit ? `Edit Quotation — ${selectedQuotation?.quotationNumber || ''}` : 'Create New Quotation'}
        </Typography>
        <Button variant="outlined" size="small" startIcon={<ArrowBackOutlined />}
          onClick={() => navigate(backPath)} sx={{ color: '#5A5A56', borderColor: '#E3E1DA' }}>
          Back
        </Button>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      {/* Section 1 — Quotation Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: '20px 24px' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2, color: '#1A1A18' }}>Quotation Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth label="Quotation Number" value={qtNumber}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { color: '#5A5A56', fontFamily: 'DM Mono', fontSize: 13 } }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                value={leadOption}
                inputValue={leadInputValue}
                onInputChange={handleLeadInputChange}
                onChange={(_, val) => {
                  setLeadOption(val);
                  setLeadInputValue(val?.companyName || '');
                }}
                options={leadOptions}
                getOptionLabel={(opt) => opt?.companyName || ''}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                loading={leadSearching}
                filterOptions={(x) => x}
                noOptionsText={leadInputValue.length < 2 ? 'Type to search leads…' : 'No leads found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Lead / Company *"
                    placeholder="Search by company name…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {leadSearching ? <CircularProgress color="inherit" size={14} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth label="Quotation Date *" type="date"
                InputLabelProps={{ shrink: true }}
                error={!!errors.quotationDate} helperText={errors.quotationDate?.message}
                {...register('quotationDate')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth label="Validity Period (days) *" type="number"
                error={!!errors.validityDays} helperText={errors.validityDays?.message}
                {...register('validityDays')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="paymentTerms" control={control} render={({ field }) => (
                <FormControl size="small" fullWidth error={!!errors.paymentTerms}>
                  <InputLabel>Payment Terms *</InputLabel>
                  <Select label="Payment Terms *" {...field}>
                    {PAYMENT_TERMS.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                  {errors.paymentTerms && <FormHelperText>{errors.paymentTerms.message}</FormHelperText>}
                </FormControl>
              )} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 2 — Line Items */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: '20px 24px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1A1A18' }}>Line Items</Typography>
            <Button size="small" variant="outlined" startIcon={<AddOutlined />}
              onClick={() => append({ ...DEFAULT_ITEM })}
              sx={{ fontSize: 12, borderColor: '#E3E1DA', color: '#1A1A18' }}>
              Add Row
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 32, px: 1 }}>#</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Product / Module</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Description</TableCell>
                  <TableCell sx={{ width: 70 }} align="right">Qty</TableCell>
                  <TableCell sx={{ width: 110 }} align="right">Unit Price</TableCell>
                  <TableCell sx={{ width: 80 }} align="right">Disc %</TableCell>
                  <TableCell sx={{ width: 80 }} align="right">GST %</TableCell>
                  <TableCell sx={{ width: 120 }} align="right">Line Total</TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, idx) => {
                  const item = watchedItems[idx] || {};
                  return (
                    <TableRow key={field.id}>
                      <TableCell sx={{ px: 1 }}>
                        <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#5A5A56' }}>{idx + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Product name"
                          {...register(`lineItems.${idx}.productName`)}
                          inputProps={{ style: { fontSize: 12 } }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth placeholder="Description"
                          {...register(`lineItems.${idx}.description`)}
                          inputProps={{ style: { fontSize: 12 } }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" sx={{ width: 64 }}
                          {...register(`lineItems.${idx}.qty`)}
                          inputProps={{ min: 0, style: { fontSize: 12, textAlign: 'right' } }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" sx={{ width: 100 }}
                          {...register(`lineItems.${idx}.unitPrice`)}
                          inputProps={{ min: 0, step: '0.01', style: { fontSize: 12, textAlign: 'right' } }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" sx={{ width: 68 }}
                          {...register(`lineItems.${idx}.discountPercent`)}
                          inputProps={{ min: 0, max: 100, style: { fontSize: 12, textAlign: 'right' } }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" sx={{ width: 68 }}
                          {...register(`lineItems.${idx}.gstPercent`)}
                          inputProps={{ min: 0, style: { fontSize: 12, textAlign: 'right' } }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono', fontWeight: 600 }}>
                          {formatINR(calcLineTotal(item))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => remove(idx)} disabled={fields.length === 1}
                          sx={{ color: '#A32D2D' }}>
                          <DeleteOutlined sx={{ fontSize: 15 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Box sx={{ width: 280, background: '#F7F6F3', border: '1px solid #E3E1DA', borderRadius: '8px', p: 2 }}>
              <TotalRow label="Subtotal" value={totals.subtotal} />
              <TotalRow label="Total Discount (−)" value={totals.totalDiscount} color="#A32D2D" />
              <TotalRow label="Total GST (+)" value={totals.totalGst} color="#185FA5" />
              <Divider sx={{ my: 1 }} />
              <TotalRow label="Grand Total" value={totals.grandTotal} bold color="#1A1A18" />
              {totals.grandTotal > APPROVAL_THRESHOLD && (
                <Alert severity="warning" sx={{ mt: 1.5, py: 0.5, fontSize: 11, borderRadius: '6px' }}>
                  Exceeds ₹{(APPROVAL_THRESHOLD / 1000).toFixed(0)}K — requires manager approval
                </Alert>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Section 3 — Terms & Conditions */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: '20px 24px' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2, color: '#1A1A18' }}>Terms & Conditions</Typography>
          <TextField size="small" fullWidth multiline rows={5}
            placeholder="Enter payment terms, delivery conditions, warranty clauses, etc."
            {...register('termsAndConditions')}
            inputProps={{ style: { fontSize: 13, fontFamily: 'DM Sans' } }} />
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => navigate(backPath)}
          color="inherit" sx={{ borderColor: '#E3E1DA' }}>
          Cancel
        </Button>
        <Button variant="outlined" startIcon={<PictureAsPdfOutlined />} onClick={handlePreview}
          sx={{ borderColor: '#E3E1DA', color: '#5A5A56' }}>
          Preview PDF
        </Button>
        <Button variant="outlined" startIcon={actionLoading ? <CircularProgress size={15} color="inherit" /> : <SaveOutlined />}
          onClick={handleDraft} disabled={actionLoading}
          sx={{ borderColor: '#534AB7', color: '#534AB7' }}>
          Save as Draft
        </Button>
        <Button variant="contained" startIcon={actionLoading ? <CircularProgress size={15} color="inherit" /> : <SendOutlined />}
          onClick={handleSubmitForApproval} disabled={actionLoading}>
          Submit for Approval
        </Button>
      </Box>
    </PageWrapper>
  );
}
