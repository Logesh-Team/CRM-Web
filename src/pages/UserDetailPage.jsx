import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Grid, Button, IconButton,
  Chip, CircularProgress, Tooltip,
} from '@mui/material';
import { EditOutlined, ShieldOutlined, PowerSettingsNewOutlined, DeleteOutlined } from '@mui/icons-material';
import { fetchUserById, fetchAuditByUser, deleteUser } from '../features/users/usersSlice';
import { usePermission } from '../hooks/usePermission';
import { useCurrentUser } from '../hooks/useCurrentUser';
import UserAvatar from '../components/common/UserAvatar';
import RoleBadge from '../components/common/RoleBadge';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import PageWrapper from '../components/common/PageWrapper';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RoleChangeDialog from '../features/users/components/RoleChangeDialog';
import ToggleActiveDialog from '../features/users/components/ToggleActiveDialog';
import { ROLE_PERMISSIONS, PERMISSION_CATEGORIES } from '../constants/roles';
import { formatDateTime, timeAgo } from '../utils/formatDate';
import { formatLastLogin } from '../utils/formatUser';
import { getAuditActionColor, formatAuditAction } from '../utils/auditUtils';

function FieldRow({ label, value, mono }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, color: '#1A1A18', fontFamily: mono ? 'DM Mono' : 'DM Sans', wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isSuperAdmin } = usePermission();
  const { user: currentUser } = useCurrentUser();
  const { selectedUser: user, loading, error, auditLogs } = useSelector((s) => s.users);

  const [roleDialog, setRoleDialog] = useState(false);
  const [toggleDialog, setToggleDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
      dispatch(fetchAuditByUser(id));
    }
  }, [id, dispatch]);

  const isOwn = user?.id === currentUser?.id || user?.id === currentUser?.sub;
  const active = user?.isActive ?? user?.active ?? true;
  const userPerms = ROLE_PERMISSIONS[user?.role] || [];

  const grouped = Object.entries(PERMISSION_CATEGORIES).map(([cat, fn]) => ({
    cat,
    perms: userPerms.filter(fn),
  })).filter((g) => g.perms.length > 0);

  const CAT_COLORS = {
    User: { bg: '#EEEDFE', text: '#534AB7' },
    Lead: { bg: '#E6F1FB', text: '#185FA5' },
    Activity: { bg: '#E1F5EE', text: '#0F6E56' },
    Reports: { bg: '#FAEEDA', text: '#BA7517' },
    System: { bg: '#FCEBEB', text: '#A32D2D' },
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    const result = await dispatch(deleteUser({ id }));
    setDeleteLoading(false);
    if (deleteUser.fulfilled.match(result)) navigate('/users');
    else setDeleteDialog(false);
  };

  if (loading && !user) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );
  if (error) return <ApiErrorAlert error={error} />;
  if (!user) return null;

  return (
    <PageWrapper title={user.name || user.fullName}
      breadcrumbs={[{ label: 'User Management', path: '/users' }, { label: user.name || user.fullName }]}>
      <Box sx={{ display: 'flex', gap: 2.5 }}>
        {/* Left column */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <Card>
            <CardContent sx={{ p: '24px' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                <UserAvatar name={user.name || user.fullName} size="lg" imageUrl={user.profileImageUrl} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 0.5 }}>
                    {user.name || user.fullName}
                    {isOwn && <Chip label="You" size="small" sx={{ ml: 1, height: 18, fontSize: 10, background: '#E6F1FB', color: '#185FA5' }} />}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#5A5A56', mb: 1 }}>{user.email}</Typography>
                  <RoleBadge role={user.role} />
                </Box>
                {isSuperAdmin && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Profile">
                      <IconButton size="small" onClick={() => navigate(`/users/${id}/edit`)}>
                        <EditOutlined sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Change Role">
                      <IconButton size="small" onClick={() => setRoleDialog(true)}>
                        <ShieldOutlined sx={{ fontSize: 17, color: '#534AB7' }} />
                      </IconButton>
                    </Tooltip>
                    {!isOwn && (
                      <>
                        <Tooltip title={active ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => setToggleDialog(true)}>
                            <PowerSettingsNewOutlined sx={{ fontSize: 17, color: active ? '#A32D2D' : '#3B6D11' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton size="small" onClick={() => setDeleteDialog(true)}>
                            <DeleteOutlined sx={{ fontSize: 17, color: '#A32D2D' }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                )}
              </Box>

              {/* Fields */}
              <Grid container spacing={2.5}>
                {[
                  { label: 'User ID', value: user.id, mono: true },
                  { label: 'Role', value: <RoleBadge role={user.role} /> },
                  { label: 'Department', value: user.department },
                  { label: 'Designation', value: user.designation },
                  { label: 'Phone', value: user.phone || user.mobile },
                  { label: 'Email', value: user.email },
                  { label: 'Status', value: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                      padding: '2px 9px', fontSize: 10, fontWeight: 600,
                      background: active ? '#EAF3DE' : '#FCEBEB', color: active ? '#3B6D11' : '#A32D2D' }}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  )},
                  { label: 'Email Verified', value: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                      padding: '2px 9px', fontSize: 10, fontWeight: 600,
                      background: user.emailVerified ? '#EAF3DE' : '#F0EEE9',
                      color: user.emailVerified ? '#3B6D11' : '#5A5A56' }}>
                      {user.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  )},
                  { label: 'Last Login', value: formatLastLogin(user.lastLoginAt) },
                  { label: 'Password Changed', value: formatDateTime(user.passwordChangedAt) },
                  { label: 'Created At', value: formatDateTime(user.createdAt) },
                  { label: 'Created By', value: user.createdByName },
                ].map((f, i) => (
                  <Grid item xs={6} sm={4} key={i}>
                    {typeof f.value === 'string' || !f.value
                      ? <FieldRow label={f.label} value={f.value} mono={f.mono} />
                      : <Box>
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                            {f.label}
                          </Typography>
                          {f.value}
                        </Box>
                    }
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Right column */}
        <Box sx={{ width: 320, flexShrink: 0 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '16px 20px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>Role Permissions</Typography>
              <Typography sx={{ fontSize: 11, color: '#5A5A56', mb: 2 }}>
                Permissions are role-based and managed by Super Admin
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

          {/* Audit trail */}
          <Card>
            <CardContent sx={{ p: '16px 20px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Audit Trail</Typography>
                <Button size="small" sx={{ fontSize: 11, color: '#185FA5' }}
                  onClick={() => navigate(`/users/audit-logs?userId=${id}`)}>
                  View All
                </Button>
              </Box>
              {auditLogs.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: '#5A5A56', py: 2, textAlign: 'center' }}>
                  No audit records
                </Typography>
              ) : auditLogs.slice(0, 5).map((log, i) => {
                const col = getAuditActionColor(log.action);
                return (
                  <Box key={log.id || i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                      padding: '1px 7px', fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap',
                      background: col.bg, color: col.text }}>
                      {formatAuditAction(log.action)}
                    </span>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {log.description && (
                        <Typography sx={{ fontSize: 11, color: '#5A5A56', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.description}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#5A5A56' }}>
                        {timeAgo(log.performedAt || log.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <RoleChangeDialog open={roleDialog} user={user}
        onClose={() => setRoleDialog(false)}
        onSuccess={() => dispatch(fetchUserById(id))} />
      <ToggleActiveDialog open={toggleDialog} user={user}
        onClose={() => setToggleDialog(false)}
        onSuccess={() => dispatch(fetchUserById(id))} />
      <ConfirmDialog open={deleteDialog} title="Delete User"
        message={`Permanently delete ${user.name || user.fullName}? This action cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} loading={deleteLoading} />
    </PageWrapper>
  );
}
