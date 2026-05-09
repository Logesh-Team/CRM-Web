import React from 'react';
import { Box, Skeleton } from '@mui/material';

export default function LoadingSkeleton({ rows = 6, cols = 5 }) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: '1px solid #F0EEE9' }}
        >
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton
              key={j}
              variant="text"
              sx={{ flex: j === 0 ? 0.6 : 1, height: 20, borderRadius: '4px' }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
