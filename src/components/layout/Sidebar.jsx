import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  DashboardOutlined,
  PeopleOutlined,
  SearchOutlined,
  ViewKanbanOutlined,
  PhoneOutlined,
  MarkEmailUnreadOutlined,
  VideocamOutlined,
  DescriptionOutlined,
  BarChartOutlined,
  LogoutOutlined,
  ManageAccountsOutlined,
  HistoryOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { usePermission } from '../../hooks/usePermission';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import UserAvatar from '../common/UserAvatar';
import RoleBadge from '../common/RoleBadge';

const SIDEBAR_WIDTH = 220;

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: DashboardOutlined, path: '/dashboard' },
    ],
  },
  {
    label: 'LEADS',
    items: [
      { label: 'All Leads', icon: PeopleOutlined, path: '/leads', badge: true },
      { label: 'AI Lead Search', icon: SearchOutlined, path: '/ai-search' },
      { label: 'Pipeline', icon: ViewKanbanOutlined, path: '/pipeline' },
    ],
  },
  {
    label: 'COMMUNICATIONS',
    items: [
      { label: 'Voice Calls', icon: PhoneOutlined, path: '/calls' },
      { label: 'Follow-up', icon: MarkEmailUnreadOutlined, path: '/follow-up' },
    ],
  },
  {
    label: 'SALES',
    items: [
      { label: 'Demos', icon: VideocamOutlined, path: '/demos' },
      { label: 'Quotations', icon: DescriptionOutlined, path: '/quotations', badge: true },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { label: 'Reports', icon: BarChartOutlined, path: '/reports' },
    ],
  },
];

function SidebarContent({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { name, role } = useCurrentUser();
  const { isSuperAdmin, isManager } = usePermission();
  const totalLeads = useSelector((state) => state.leads.pagination.totalElements);

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/users') return location.pathname === '/users' || (location.pathname.startsWith('/users/') && !location.pathname.startsWith('/users/audit-logs'));
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRight: '1px solid #E3E1DA',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2, py: 2.5, borderBottom: '1px solid #E3E1DA' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '7px',
              background: '#1A1A18',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'DM Mono' }}>
              C
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1A1A18' }}>
            Craviq CRM
          </Typography>
          <Chip
            label="v1"
            size="small"
            sx={{
              height: 16,
              fontSize: 9,
              fontFamily: 'DM Mono',
              background: '#F0EEE9',
              color: '#5A5A56',
              ml: 'auto',
            }}
          />
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <Box key={section.label} sx={{ mb: 0.5 }}>
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 600,
                color: '#5A5A56',
                letterSpacing: '0.08em',
                px: 2,
                pt: 1.5,
                pb: 0.5,
              }}
            >
              {section.label}
            </Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <ListItemButton
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      mx: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '7px',
                      mb: 0.25,
                      background: active ? '#1A1A18' : 'transparent',
                      '&:hover': {
                        background: active ? '#1A1A18' : '#F0EEE9',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <Icon
                        sx={{
                          fontSize: 16,
                          color: active ? '#FFFFFF' : '#5A5A56',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        color: active ? '#FFFFFF' : '#1A1A18',
                        fontFamily: 'DM Sans',
                      }}
                    />
                    {item.badge && item.label === 'All Leads' && totalLeads > 0 && (
                      <Chip
                        label={totalLeads > 999 ? '999+' : totalLeads}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 10,
                          fontFamily: 'DM Mono',
                          background: active ? 'rgba(255,255,255,0.2)' : '#F0EEE9',
                          color: active ? '#fff' : '#5A5A56',
                        }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}

        {/* ADMIN section — visible to SUPER_ADMIN and SALES_MANAGER */}
        {(isSuperAdmin || isManager) && (
          <Box sx={{ mb: 0.5 }}>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#5A5A56', letterSpacing: '0.08em', px: 2, pt: 1.5, pb: 0.5 }}>
              ADMIN
            </Typography>
            <List dense disablePadding>
              {[
                { label: 'Users', icon: ManageAccountsOutlined, path: '/users' },
                ...(isSuperAdmin ? [{ label: 'Audit Logs', icon: HistoryOutlined, path: '/users/audit-logs' }] : []),
              ].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <ListItemButton
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      mx: 1, px: 1.5, py: 0.75, borderRadius: '7px', mb: 0.25,
                      background: active ? '#1A1A18' : 'transparent',
                      '&:hover': { background: active ? '#1A1A18' : '#F0EEE9' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <Icon sx={{ fontSize: 16, color: active ? '#FFFFFF' : '#5A5A56' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        color: active ? '#FFFFFF' : '#1A1A18',
                        fontFamily: 'DM Sans',
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        )}
      </Box>

      {/* User footer */}
      <Box
        onClick={() => handleNav('/profile')}
        sx={{
          px: 1.5, py: 1.5, borderTop: '1px solid #E3E1DA',
          display: 'flex', alignItems: 'center', gap: 1,
          cursor: 'pointer', borderRadius: '0 0 0 0',
          '&:hover': { background: '#F7F6F3' },
        }}
      >
        <UserAvatar name={name} size="sm" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1A1A18', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || 'User'}
          </Typography>
          <RoleBadge role={role} />
        </Box>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); logout(); }}
          sx={{ color: '#5A5A56', '&:hover': { color: '#A32D2D' } }}
          title="Logout"
        >
          <LogoutOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' },
        }}
      >
        <SidebarContent onClose={onMobileClose} />
      </Drawer>
    );
  }

  return <SidebarContent />;
}
