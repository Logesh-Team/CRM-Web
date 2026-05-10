import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Button, Select, MenuItem, FormControl,
  InputLabel, InputBase, Typography, Pagination, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip,
} from '@mui/material';
import {
  AddOutlined, SearchOutlined, RefreshOutlined, VisibilityOutlined,
  EditOutlined, ShieldOutlined, PowerSettingsNewOutlined, DeleteOutlined,
} from '@mui/icons-material';
import { fetchUsers, setFilters, resetFilters, setPagination, deleteUser } from '../features/users/usersSlice';
import { useDebounce } from '../hooks/useDebounce';
import { usePermission } from '../hooks/usePermission';
import { useCurrentUser } from '../hooks/useCurrentUser';
import RoleBadge from '../components/common/RoleBadge';
import UserAvatar from '../components/common/UserAvatar';
import PermissionGate from '../components/common/PermissionGate';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import PageWrapper from '../components/common/PageWrapper';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import RoleChangeDialog from '../features/users/components/RoleChangeDialog';
import ToggleActiveDialog from '../features/users/components/ToggleActiveDialog';
import { USER_ROLES } from '../constants/roles';
import { formatLastLogin } from '../utils/formatUser';

export default function UsersListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermission();
  const { user: currentUser } = useCurrentUser();
  const { users, loading, error, pagination, filters } = useSelector((s) => s.users);

  const [keyword, setKeyword] = useState(filters.keyword || '');
  const debouncedKeyword = useDebounce(keyword, 400);

  const [roleDialog, setRoleDialog] = useState({ open: false, user: null });
  const [toggleDialog, setToggleDialog] = useState({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(() => {
    dispatch(fetchUsers({
      page: pagination.page,
      size: pagination.size,
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== '' && { isActive: filters.isActive }),
      ...(debouncedKeyword && { keyword: debouncedKeyword }),
    }));
  }, [dispatch, pagination.page, pagination.size, filters, debouncedKeyword]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { dispatch(setFilters({ keyword: debouncedKeyword })); }, [debouncedKeyword, dispatch]);

  const handleReset = () => { dispatch(resetFilters()); setKeyword(''); };
  const handlePage = (_, p) => dispatch(setPagination({ page: p - 1 }));

  const handleDelete = async () => {
    setDeleteLoading(true);
    await dispatch(deleteUser({ id: deleteDialog.user.id }));
    setDeleteLoading(false);
    setDeleteDialog({ open: false, user: null });
  };

  const totalActive = users.filter((u) => u.isActive ?? u.active).length;
  const totalInactive = users.length - totalActive;
  const totalRoles = [...new Set(users.map((u) => u.role))].length;

  const isOwnRow = (u) => u.id === currentUser?.id || u.id === currentUser?.sub;

  return (
    <PageWrapper title="User Management">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>User Management</Typography>
        <PermissionGate permission="USER_CREATE">
          <Button variant="contained" size="small" startIcon={<AddOutlined />}
            onClick={() => navigate('/users/new')}>
            Add User
          </Button>
        </PermissionGate>
      </Box>

      {error && <ApiErrorAlert error={error} />}

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {[
          { label: 'Total Users', value: pagination.totalElements || users.length },
          { label: 'Active Users', value: totalActive, color: '#3B6D11' },
          { label: 'Inactive Users', value: totalInactive, color: '#A32D2D' },
          { label: 'Roles', value: totalRoles, color: '#534AB7' },
        ].map((s) => (
          <Card key={s.label} sx={{ flex: 1 }}>
            <CardContent sx={{ p: '12px 16px !important' }}>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 300, fontFamily: 'DM Mono', color: s.color || '#1A1A18', mt: 0.5 }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: '12px 16px !important' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #E3E1DA', borderRadius: '8px',
              px: 1.5, height: 36, gap: 1, minWidth: 200 }}>
              <SearchOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
              <InputBase placeholder="Search name or email…" value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                sx={{ fontSize: 13, fontFamily: 'DM Sans', flex: 1 }} />
            </Box>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: 13 }}>Role</InputLabel>
              <Select label="Role" value={filters.role} sx={{ fontSize: 13, height: 36 }}
                onChange={(e) => dispatch(setFilters({ role: e.target.value }))}>
                <MenuItem value="">All Roles</MenuItem>
                {USER_ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
              <Select label="Status" value={filters.isActive} sx={{ fontSize: 13, height: 36 }}
                onChange={(e) => dispatch(setFilters({ isActive: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" size="small" startIcon={<RefreshOutlined />}
              onClick={handleReset} sx={{ height: 36, color: '#5A5A56', borderColor: '#E3E1DA' }}>
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <Box sx={{ p: 2 }}><LoadingSkeleton rows={8} cols={7} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ border: 'none', py: 6, textAlign: 'center', color: '#5A5A56', fontSize: 13 }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : users.map((u) => {
                  const isOwn = isOwnRow(u);
                  const isBot = u.role === 'SYSTEM_BOT';
                  const active = u.isActive ?? u.active ?? true;
                  return (
                    <TableRow key={u.id}
                      sx={{
                        borderLeft: isOwn ? '3px solid #185FA5' : '3px solid transparent',
                        '&:hover': { background: '#F7F6F3' },
                      }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <UserAvatar name={u.name || u.fullName} size="sm" imageUrl={u.profileImageUrl} />
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                {u.name || u.fullName || '—'}
                              </Typography>
                              {isOwn && (
                                <Chip label="You" size="small" sx={{ height: 16, fontSize: 9, background: '#E6F1FB', color: '#185FA5' }} />
                              )}
                              {isBot && (
                                <Chip label="System" size="small" sx={{ height: 16, fontSize: 9, background: '#F0EEE9', color: '#5A5A56' }} />
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell><Typography sx={{ fontSize: 12 }}>{u.department || '—'}</Typography></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono' }}>{u.phone || u.mobile || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                          padding: '2px 9px', fontSize: 10, fontWeight: 600,
                          background: active ? '#EAF3DE' : '#FCEBEB',
                          color: active ? '#3B6D11' : '#A32D2D',
                        }}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>
                          {formatLastLogin(u.lastLoginAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigate(`/users/${u.id}`)}>
                              <VisibilityOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
                            </IconButton>
                          </Tooltip>
                          {!isBot && isSuperAdmin && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => navigate(`/users/${u.id}/edit`)}>
                                  <EditOutlined sx={{ fontSize: 15, color: '#5A5A56' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Change Role">
                                <IconButton size="small" onClick={() => setRoleDialog({ open: true, user: u })}>
                                  <ShieldOutlined sx={{ fontSize: 15, color: '#534AB7' }} />
                                </IconButton>
                              </Tooltip>
                              {!isOwn && (
                                <>
                                  <Tooltip title={active ? 'Deactivate' : 'Activate'}>
                                    <IconButton size="small" onClick={() => setToggleDialog({ open: true, user: u })}>
                                      <PowerSettingsNewOutlined sx={{ fontSize: 15, color: active ? '#A32D2D' : '#3B6D11' }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton size="small" onClick={() => setDeleteDialog({ open: true, user: u })}>
                                      <DeleteOutlined sx={{ fontSize: 15, color: '#A32D2D' }} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #F0EEE9' }}>
            <Pagination count={pagination.totalPages} page={pagination.page + 1}
              onChange={handlePage} size="small" shape="rounded" />
          </Box>
        )}
      </Card>

      <RoleChangeDialog open={roleDialog.open} user={roleDialog.user}
        onClose={() => setRoleDialog({ open: false, user: null })}
        onSuccess={load} />
      <ToggleActiveDialog open={toggleDialog.open} user={toggleDialog.user}
        onClose={() => setToggleDialog({ open: false, user: null })}
        onSuccess={load} />
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deleteDialog.user?.name || deleteDialog.user?.fullName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, user: null })}
        loading={deleteLoading}
      />
    </PageWrapper>
  );
}
