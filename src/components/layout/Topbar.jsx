import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Button,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  NotificationsOutlined,
  SettingsOutlined,
  SearchOutlined,
  MenuOutlined,
  AutoAwesomeOutlined,
} from '@mui/icons-material';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/leads': 'All Leads',
  '/leads/new': 'New Lead',
  '/pipeline': 'Pipeline',
  '/ai-search': 'AI Lead Search',
  '/calls': 'Voice Calls',
  '/follow-up': 'Follow-up',
  '/demos': 'Demos',
  '/quotations': 'Quotations',
  '/reports': 'Reports',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.match(/^\/leads\/[^/]+\/edit$/)) return 'Edit Lead';
  if (pathname.match(/^\/leads\/[^/]+$/)) return 'Lead Details';
  return 'NexCRM';
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchVal, setSearchVal] = useState('');

  return (
    <Box
      sx={{
        height: 52,
        background: '#FFFFFF',
        borderBottom: '1px solid #E3E1DA',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 2,
        flexShrink: 0,
      }}
    >
      {isMobile && (
        <IconButton size="small" onClick={onMenuClick} sx={{ color: '#1A1A18' }}>
          <MenuOutlined fontSize="small" />
        </IconButton>
      )}

      {/* Page title */}
      <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1A1A18', flexShrink: 0 }}>
        {getPageTitle(location.pathname)}
      </Typography>

      {/* Search */}
      <Box
        sx={{
          flex: 1,
          maxWidth: 360,
          mx: 'auto',
          background: '#F7F6F3',
          border: '1px solid #E3E1DA',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 1,
          height: 34,
        }}
      >
        <SearchOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
        <InputBase
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search leads, companies…"
          sx={{
            flex: 1,
            fontSize: 13,
            fontFamily: 'DM Sans',
            color: '#1A1A18',
            '& input::placeholder': { color: '#5A5A56' },
          }}
          inputProps={{ 'aria-label': 'global search' }}
        />
        <Typography
          sx={{
            fontSize: 10,
            color: '#5A5A56',
            fontFamily: 'DM Mono',
            background: '#E3E1DA',
            px: 0.75,
            borderRadius: '4px',
          }}
        >
          ⌘K
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
        <IconButton size="small" sx={{ color: '#5A5A56' }}>
          <Badge
            variant="dot"
            sx={{ '& .MuiBadge-dot': { background: '#A32D2D', width: 6, height: 6, minWidth: 6 } }}
          >
            <NotificationsOutlined sx={{ fontSize: 18 }} />
          </Badge>
        </IconButton>
        <IconButton size="small" sx={{ color: '#5A5A56' }}>
          <SettingsOutlined sx={{ fontSize: 18 }} />
        </IconButton>
        <Button
          variant="contained"
          size="small"
          startIcon={<AutoAwesomeOutlined sx={{ fontSize: 14 }} />}
          onClick={() => navigate('/ai-search')}
          sx={{
            background: '#534AB7',
            '&:hover': { background: '#3f37a0' },
            fontSize: 12,
            px: 1.5,
          }}
        >
          AI Search
        </Button>
      </Box>
    </Box>
  );
}
