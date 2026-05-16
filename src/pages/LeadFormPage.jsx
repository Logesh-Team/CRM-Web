import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Typography, Grid, TextField, Button,
  Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Chip, InputAdornment, ToggleButtonGroup, ToggleButton,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { ExpandMoreOutlined, SaveOutlined, ArrowBackOutlined } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { fetchLeadById, createLead, updateLead } from '../features/leads/leadsSlice';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import PageWrapper from '../components/common/PageWrapper';
import axiosInstance from '../api/axiosInstance';
import { USERS } from '../api/endpoints';

const schema = yup.object({
  companyName: yup.string().required('Company name is required'),
  mobile: yup
    .string()
    .required('Mobile is required')
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: yup.string().email('Enter a valid email').nullable().optional(),
});

const SECTION_FIELDS = [
  {
    title: 'Company Identity',
    fields: [
      { name: 'companyName', label: 'Company Name *', xs: 12, sm: 6 },
      { name: 'industryType', label: 'Industry Type', xs: 12, sm: 6 },
      { name: 'subIndustry', label: 'Sub-Industry', xs: 12, sm: 6 },
      { name: 'companySize', label: 'Company Size', xs: 12, sm: 6 },
    ],
  },
  {
    title: 'Location',
    fields: [
      { name: 'addressLine1', label: 'Address Line 1', xs: 12 },
      { name: 'addressLine2', label: 'Address Line 2', xs: 12 },
      { name: 'city', label: 'City', xs: 12, sm: 4 },
      { name: 'state', label: 'State', xs: 12, sm: 4 },
      { name: 'pinCode', label: 'PIN Code', xs: 12, sm: 4 },
      { name: 'country', label: 'Country', xs: 12, sm: 6, defaultValue: 'India' },
      { name: 'googleMapsLink', label: 'Google Maps Link', xs: 12, sm: 6 },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { name: 'primaryContactName', label: 'Primary Contact Name', xs: 12, sm: 6 },
      { name: 'designation', label: 'Designation', xs: 12, sm: 6 },
      { name: 'mobile', label: 'Mobile *', xs: 12, sm: 4 },
      { name: 'alternateMobile', label: 'Alternate Mobile', xs: 12, sm: 4 },
      { name: 'email', label: 'Email', xs: 12, sm: 4 },
      { name: 'whatsappNumber', label: 'WhatsApp Number', xs: 12, sm: 4 },
      { name: 'website', label: 'Website', xs: 12, sm: 4 },
      { name: 'gstNumber', label: 'GST Number', xs: 12, sm: 4 },
    ],
  },
];

export default function LeadFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEdit = !!id;

  const { selectedLead: lead, error } = useSelector((state) => state.leads);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (isEdit) dispatch(fetchLeadById(id));
    axiosInstance.get(USERS.LIST).then((r) => {
      const data = r.data?.data;
      setUsers(data?.content || (Array.isArray(data) ? data : []));
    }).catch(() => {});
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && lead) {
      reset({ ...lead });
      setTags(lead.tags || []);
    }
  }, [lead, isEdit, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = { ...data, tags };
    let result;
    if (isEdit) {
      result = await dispatch(updateLead({ id, data: payload }));
      if (updateLead.fulfilled.match(result)) {
        toast.success('Lead updated');
        navigate(`/leads/${id}`);
      } else {
        toast.error(result.payload || 'Update failed');
      }
    } else {
      result = await dispatch(createLead(payload));
      if (createLead.fulfilled.match(result)) {
        toast.success('Lead created');
        navigate(`/leads/${result.payload.id}`);
      } else {
        toast.error(result.payload || 'Create failed');
      }
    }
    setSubmitting(false);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <PageWrapper
      title={isEdit ? 'Edit Lead' : 'New Lead'}
      breadcrumbs={[
        { label: 'All Leads', path: '/leads' },
        ...(isEdit && lead ? [{ label: lead.companyName, path: `/leads/${id}` }] : []),
        { label: isEdit ? 'Edit' : 'New Lead' },
      ]}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? 'Edit Lead' : 'New Lead'}</Typography>
        <Button variant="outlined" size="small" startIcon={<ArrowBackOutlined />} onClick={() => navigate(-1)} sx={{ color: '#5A5A56', borderColor: '#E3E1DA' }}>
          Back
        </Button>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Standard text sections */}
        {SECTION_FIELDS.map((section) => (
          <Accordion key={section.title} defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{section.title}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Grid container spacing={2}>
                {section.fields.map((f) => (
                  <Grid item xs={f.xs} sm={f.sm} key={f.name}>
                    <TextField
                      size="small"
                      fullWidth
                      label={f.label}
                      defaultValue={f.defaultValue}
                      error={!!errors[f.name]}
                      helperText={errors[f.name]?.message}
                      {...register(f.name)}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Source & Classification */}
        <Accordion defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Source & Classification</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Lead Source</InputLabel>
                  <Select label="Lead Source" defaultValue="" {...register('leadSource')}>
                    {[
                      { v: 'WEBSITE',    l: 'Website' },
                      { v: 'REFERRAL',   l: 'Referral' },
                      { v: 'COLD_CALL',  l: 'Cold Call' },
                      { v: 'LINKEDIN',   l: 'LinkedIn' },
                      { v: 'INDIAMART',  l: 'IndiaMart' },
                      { v: 'TRADE_FAIR', l: 'Trade Fair' },
                      { v: 'CAMPAIGN',   l: 'Campaign' },
                      { v: 'MANUAL',     l: 'Manual Entry' },
                      { v: 'OTHER',      l: 'Other' },
                    ].map(({ v, l }) => (
                      <MenuItem key={v} value={v}>{l}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Campaign Name" {...register('campaignName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 12, color: '#5A5A56', mb: 1 }}>Lead Grade</Typography>
                <Controller
                  name="leadGrade"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <ToggleButtonGroup
                      value={field.value}
                      exclusive
                      onChange={(_, val) => val && field.onChange(val)}
                      size="small"
                    >
                      {['A','B','C','D'].map((g) => (
                        <ToggleButton key={g} value={g} sx={{ px: 2, fontSize: 12, fontFamily: 'DM Mono', fontWeight: 700 }}>{g}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: 12, color: '#5A5A56', mb: 1 }}>Lead Priority</Typography>
                <Controller
                  name="leadPriority"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <ToggleButtonGroup
                      value={field.value}
                      exclusive
                      onChange={(_, val) => val && field.onChange(val)}
                      size="small"
                    >
                      {[{ v: 'HOT', color: '#A32D2D' }, { v: 'WARM', color: '#BA7517' }, { v: 'COLD', color: '#185FA5' }].map((p) => (
                        <ToggleButton key={p.v} value={p.v} sx={{ px: 2, fontSize: 12, fontWeight: 600 }}>{p.v}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Assignment */}
        <Accordion defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Assignment</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select label="Assigned To" defaultValue="" {...register('assignedTo')}>
                    {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.name || u.email}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Territory" {...register('territory')} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Financial */}
        <Accordion defaultExpanded sx={{ mb: 1.5, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Financial</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  label="Estimated Deal Value"
                  type="number"
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  {...register('estimatedDealValue')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Expected Revenue Month" placeholder="e.g. June 2025" {...register('expectedRevenueMonth')} />
              </Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Product Interested" multiline rows={2} {...register('productInterested')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Next Follow-up Date" type="date"
                  InputLabelProps={{ shrink: true }} {...register('nextFollowUpDate')} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Notes */}
        <Accordion defaultExpanded sx={{ mb: 2, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Notes & Additional Info</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Lead Description" multiline rows={2} {...register('leadDescription')} />
              </Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Internal Notes" multiline rows={2} {...register('internalNotes')} />
              </Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Competitor Info" {...register('competitorInfo')} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ fontSize: 12, color: '#5A5A56', mb: 1 }}>Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => setTags(tags.filter((t) => t !== tag))}
                      sx={{ fontSize: 11 }}
                    />
                  ))}
                </Box>
                <TextField
                  size="small"
                  placeholder="Type tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  sx={{ width: 240 }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate(-1)} color="inherit" sx={{ borderColor: '#E3E1DA' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            disabled={submitting}
          >
            {isEdit ? 'Save Changes' : 'Create Lead'}
          </Button>
        </Box>
      </Box>
    </PageWrapper>
  );
}
