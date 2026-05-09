import React from 'react';
import { Box, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

export default function EmptyState({ message = 'No data found', icon: Icon = InboxOutlined }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: '#5A5A56',
      }}
    >
      <Icon sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
      <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>{message}</Typography>
    </Box>
  );
}
