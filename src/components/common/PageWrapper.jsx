import React, { useEffect } from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PageWrapper({ title, breadcrumbs = [], children }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = title ? `${title} · NexCRM` : 'NexCRM';
  }, [title]);

  return (
    <Box>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1.5 }} aria-label="breadcrumb">
          {breadcrumbs.map((crumb, i) =>
            i < breadcrumbs.length - 1 ? (
              <Link
                key={i}
                underline="hover"
                sx={{ fontSize: 12, color: '#5A5A56', cursor: 'pointer' }}
                onClick={() => navigate(crumb.path)}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={i} sx={{ fontSize: 12, color: '#1A1A18' }}>
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      {children}
    </Box>
  );
}
