import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import { loginThunk, clearAuthError } from '../features/auth/authSlice';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => { dispatch(clearAuthError()); };
  }, [dispatch]);

  const onSubmit = (data) => dispatch(loginThunk(data));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#F7F6F3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400, borderRadius: '12px' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: '#1A1A18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: 'DM Mono' }}>
                C
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A18', mb: 0.5 }}>
              Craviq CRM
            </Typography>
            <Typography variant="body2" sx={{ color: '#5A5A56' }}>
              Sign in to your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="Username"
              type="text"
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              error={!!errors.username}
              helperText={errors.username?.message}
              autoComplete="username"
              {...register('username')}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              size="small"
              sx={{ mb: 3 }}
              error={!!errors.password}
              helperText={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ height: 44, fontSize: 14, fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#5A5A56' }}
          >
            {process.env.REACT_APP_APP_NAME} · AI-Powered B2B CRM
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
