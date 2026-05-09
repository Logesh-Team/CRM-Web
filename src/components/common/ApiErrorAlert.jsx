import React from 'react';
import { Alert } from '@mui/material';

export default function ApiErrorAlert({ error }) {
  if (!error) return null;
  const message =
    typeof error === 'string'
      ? error
      : error?.data?.message || error?.message || 'An unexpected error occurred.';

  return (
    <Alert severity="error" sx={{ borderRadius: '8px', mb: 2 }}>
      {message}
    </Alert>
  );
}
