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
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  NotificationsOutlined,
  SettingsOutlined,
  SearchOutlined,
  MenuOutlined,
  AutoAwesomeOutlined,
  PersonOutlined,
  LockOutlined,
  LogoutOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import UserAvatar from '../common/UserAvatar';

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
  '/users': 'User Management',
  '/users/new': 'New User',
  '/users/audit-logs': 'Audit Logs',
  '/profile': 'My Profile',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.match(/^\/leads\/[^/]+\/edit$/)) return 'Edit Lead';
  if (pathname.match(/^\/leads\/[^/]+$/)) return 'Lead Details';
  if (pathname.match(/^\/users\/[^/]+\/edit$/)) return 'Edit User';
  if (pathname.match(/^\/users\/[^/]+$/)) return 'User Details';
  return 'Craviq CRM';
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchVal, setSearchVal] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const { logout } = useAuth();
  const { name } = useCurrentUser();

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
          sx={{ background: '#534AB7', '&:hover': { background: '#3f37a0' }, fontSize: 12, px: 1.5 }}
        >
          AI Search
        </Button>

        {/* User avatar */}
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <UserAvatar name={name} size="sm" />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 0.5, minWidth: 180, borderRadius: '10px', border: '1px solid #E3E1DA', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } }}
        >
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}
            sx={{ fontSize: 13, gap: 1.5, py: 1 }}>
            <PersonOutlined sx={{ fontSize: 16, color: '#5A5A56' }} />
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile#password'); }}
            sx={{ fontSize: 13, gap: 1.5, py: 1 }}>
            <LockOutlined sx={{ fontSize: 16, color: '#5A5A56' }} />
            Change Password
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => { setAnchorEl(null); logout(); }}
            sx={{ fontSize: 13, gap: 1.5, py: 1, color: '#A32D2D' }}>
            <LogoutOutlined sx={{ fontSize: 16 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
