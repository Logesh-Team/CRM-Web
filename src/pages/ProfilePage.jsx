import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Card, CardContent, Typography, Grid, TextField,
  Button, CircularProgress, InputAdornment, IconButton, Alert, Chip,
} from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined, LockOutlined } from '@mui/icons-material';
import { fetchMe, changePassword } from '../features/users/usersSlice';
import { useCurrentUser } from '../hooks/useCurrentUser';
import UserAvatar from '../components/common/UserAvatar';
import RoleBadge from '../components/common/RoleBadge';
import PageWrapper from '../components/common/PageWrapper';
import { ROLE_PERMISSIONS, PERMISSION_CATEGORIES } from '../constants/roles';
import { formatDateTime } from '../utils/formatDate';
import { formatLastLogin } from '../utils/formatUser';

const pwdSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(8, 'Minimum 8 characters').required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Confirm your new password'),
});

function FieldItem({ label, value, mono }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, color: '#1A1A18', fontFamily: mono ? 'DM Mono' : 'DM Sans' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser, name, email, role } = useCurrentUser();
  const { meUser } = useSelector((s) => s.users);
  const user = meUser || authUser;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const { register, handleSubmit, reset: resetPwd, setError, formState: { errors } } = useForm({
    resolver: yupResolver(pwdSchema),
  });

  useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

  const onPasswordSubmit = async (data) => {
    setPwdSubmitting(true);
    setPwdError('');
    setPwdSuccess(false);
    const result = await dispatch(changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }));
    setPwdSubmitting(false);
    if (changePassword.fulfilled.match(result)) {
      setPwdSuccess(true);
      resetPwd();
    } else {
      const msg = result.payload || 'Failed to change password';
      if (msg.toLowerCase().includes('current')) {
        setError('currentPassword', { message: msg });
      } else {
        setPwdError(msg);
      }
    }
  };

  const active = user?.isActive ?? user?.active ?? true;
  const userPerms = ROLE_PERMISSIONS[role] || [];
  const grouped = Object.entries(PERMISSION_CATEGORIES)
    .map(([cat, fn]) => ({ cat, perms: userPerms.filter(fn) }))
    .filter((g) => g.perms.length > 0);

  const CAT_COLORS = {
    User: { bg: '#EEEDFE', text: '#534AB7' }, Lead: { bg: '#E6F1FB', text: '#185FA5' },
    Activity: { bg: '#E1F5EE', text: '#0F6E56' }, Reports: { bg: '#FAEEDA', text: '#BA7517' },
    System: { bg: '#FCEBEB', text: '#A32D2D' },
  };

  return (
    <PageWrapper title="My Profile">
      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2.5 }}>My Profile</Typography>

      <Box sx={{ display: 'flex', gap: 2.5 }}>
        {/* Left */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {/* Profile card */}
          <Card>
            <CardContent sx={{ p: '24px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3,
                pb: 2, borderBottom: '1px solid #F0EEE9' }}>
                <UserAvatar name={name} size="lg" imageUrl={user?.profileImageUrl} />
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 0.5 }}>{name}</Typography>
                  <Typography sx={{ fontSize: 13, color: '#5A5A56', mb: 1 }}>{email}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RoleBadge role={role} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                      padding: '2px 9px', fontSize: 10, fontWeight: 600,
                      background: active ? '#EAF3DE' : '#FCEBEB', color: active ? '#3B6D11' : '#A32D2D' }}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </Box>
                </Box>
              </Box>
              <Grid container spacing={2.5}>
                {[
                  { label: 'User ID', value: user?.id, mono: true },
                  { label: 'Department', value: user?.department },
                  { label: 'Designation', value: user?.designation },
                  { label: 'Phone', value: user?.phone || user?.mobile },
                  { label: 'Last Login', value: formatLastLogin(user?.lastLoginAt) },
                  { label: 'Member Since', value: formatDateTime(user?.createdAt) },
                ].map((f) => (
                  <Grid item xs={6} sm={4} key={f.label}>
                    <FieldItem {...f} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card id="password">
            <CardContent sx={{ p: '20px 24px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockOutlined sx={{ fontSize: 17, color: '#534AB7' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Change Password</Typography>
              </Box>

              {pwdError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: 12 }}>{pwdError}</Alert>}
              {pwdSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px', fontSize: 12 }}>Password changed successfully</Alert>}

              <Box component="form" onSubmit={handleSubmit(onPasswordSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField size="small" fullWidth label="Current Password"
                      type={showCurrent ? 'text' : 'password'}
                      error={!!errors.currentPassword} helperText={errors.currentPassword?.message}
                      InputProps={{ endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowCurrent((p) => !p)}>
                            {showCurrent ? <VisibilityOffOutlined sx={{ fontSize: 16 }} /> : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      )}}
                      {...register('currentPassword')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField size="small" fullWidth label="New Password"
                      type={showNew ? 'text' : 'password'}
                      error={!!errors.newPassword} helperText={errors.newPassword?.message}
                      InputProps={{ endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowNew((p) => !p)}>
                            {showNew ? <VisibilityOffOutlined sx={{ fontSize: 16 }} /> : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      )}}
                      {...register('newPassword')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField size="small" fullWidth label="Confirm New Password"
                      type={showConfirm ? 'text' : 'password'}
                      error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
                      InputProps={{ endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowConfirm((p) => !p)}>
                            {showConfirm ? <VisibilityOffOutlined sx={{ fontSize: 16 }} /> : <VisibilityOutlined sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      )}}
                      {...register('confirmPassword')} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" size="small" disabled={pwdSubmitting}>
                      {pwdSubmitting ? <CircularProgress size={15} color="inherit" /> : 'Update Password'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right — permissions */}
        <Box sx={{ width: 300, flexShrink: 0 }}>
          <Card>
            <CardContent sx={{ p: '16px 20px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>My Permissions</Typography>
              <Typography sx={{ fontSize: 11, color: '#5A5A56', mb: 2 }}>
                Based on your {role?.replace(/_/g, ' ')} role
              </Typography>
              {grouped.map(({ cat, perms }) => {
                const col = CAT_COLORS[cat] || { bg: '#F0EEE9', text: '#5A5A56' };
                return (
                  <Box key={cat} sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: col.text, mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {cat}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {perms.map((p) => (
                        <Chip key={p} label={p.replace(/_/g, ' ')} size="small"
                          sx={{ fontSize: 9, height: 18, background: col.bg, color: col.text, border: 'none' }} />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </PageWrapper>
  );
}
