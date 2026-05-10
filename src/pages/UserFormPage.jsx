import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, FormHelperText,
  CircularProgress, Chip, InputAdornment, IconButton,
} from '@mui/material';
import { ArrowBackOutlined, SaveOutlined, VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import { fetchUserById, createUser, updateUser } from '../features/users/usersSlice';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import PageWrapper from '../components/common/PageWrapper';
import { USER_ROLES, ROLE_PERMISSIONS } from '../constants/roles';

const createSchema = yup.object({
  name: yup.string().required('Full name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile').optional().nullable().transform((v) => v || null),
  role: yup.string().required('Role is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
  designation: yup.string().optional(),
  department: yup.string().optional(),
});

const editSchema = yup.object({
  name: yup.string().required('Full name is required'),
  phone: yup.string().matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile').optional().nullable().transform((v) => v || null),
  role: yup.string().required('Role is required'),
  designation: yup.string().optional(),
  department: yup.string().optional(),
});

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEdit = !!id;

  const { selectedUser: user, error } = useSelector((s) => s.users);
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(isEdit ? editSchema : createSchema),
  });

  const selectedRole = useWatch({ control, name: 'role', defaultValue: '' });
  const rolePerms = selectedRole ? (ROLE_PERMISSIONS[selectedRole] || []) : [];

  useEffect(() => {
    if (isEdit) dispatch(fetchUserById(id));
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && user) reset({ ...user });
  }, [user, isEdit, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    if (isEdit) {
      const { password, confirmPassword, ...rest } = data;
      const result = await dispatch(updateUser({ id, data: rest }));
      if (updateUser.fulfilled.match(result)) navigate(`/users/${id}`);
    } else {
      const { confirmPassword, ...rest } = data;
      const result = await dispatch(createUser(rest));
      if (createUser.fulfilled.match(result)) navigate('/users');
    }
    setSubmitting(false);
  };

  const displayName = isEdit ? (user?.name || user?.fullName || 'User') : '';

  return (
    <PageWrapper
      title={isEdit ? 'Edit User' : 'Create New User'}
      breadcrumbs={[
        { label: 'User Management', path: '/users' },
        ...(isEdit && user ? [{ label: displayName, path: `/users/${id}` }] : []),
        { label: isEdit ? 'Edit' : 'New User' },
      ]}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
          {isEdit ? `Edit User — ${displayName}` : 'Create New User'}
        </Typography>
        <Button variant="outlined" size="small" startIcon={<ArrowBackOutlined />}
          onClick={() => navigate(isEdit ? `/users/${id}` : '/users')}
          sx={{ color: '#5A5A56', borderColor: '#E3E1DA' }}>
          Back
        </Button>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Section 1 — Personal Info */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: '20px 24px' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2, color: '#1A1A18' }}>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Full Name *" error={!!errors.name}
                  helperText={errors.name?.message} {...register('name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Email *" type="email"
                  disabled={isEdit}
                  error={!!errors.email} helperText={errors.email?.message} {...register('email')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Phone" placeholder="9876543210"
                  error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Designation" {...register('designation')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField size="small" fullWidth label="Department" {...register('department')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Section 2 — Role & Access */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: '20px 24px' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2, color: '#1A1A18' }}>Role & Access</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="role" control={control} defaultValue=""
                  render={({ field }) => (
                    <FormControl size="small" fullWidth error={!!errors.role}>
                      <InputLabel>Role *</InputLabel>
                      <Select label="Role *" {...field}>
                        {USER_ROLES.map((r) => (
                          <MenuItem key={r.value} value={r.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                              {r.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            {selectedRole && (
              <Box sx={{ mt: 2, background: '#F7F6F3', border: '1px solid #E3E1DA', borderRadius: '8px', p: 1.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#5A5A56', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Capabilities for {USER_ROLES.find((r) => r.value === selectedRole)?.label}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {rolePerms.map((p) => (
                    <Chip key={p} label={p.replace(/_/g, ' ')} size="small"
                      sx={{ fontSize: 10, height: 20, background: '#FFFFFF', border: '1px solid #E3E1DA' }} />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Section 3 — Password (create only) */}
        {!isEdit && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px 24px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2, color: '#1A1A18' }}>Set Password</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField size="small" fullWidth label="Password *"
                    type={showPwd ? 'text' : 'password'}
                    error={!!errors.password} helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPwd((p) => !p)}>
                            {showPwd ? <VisibilityOffOutlined sx={{ fontSize: 16 }} /> : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    {...register('password')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField size="small" fullWidth label="Confirm Password *"
                    type={showConfirm ? 'text' : 'password'}
                    error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowConfirm((p) => !p)}>
                            {showConfirm ? <VisibilityOffOutlined sx={{ fontSize: 16 }} /> : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    {...register('confirmPassword')} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate(isEdit ? `/users/${id}` : '/users')}
            color="inherit" sx={{ borderColor: '#E3E1DA' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </Box>
      </Box>
    </PageWrapper>
  );
}
