import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Select, MenuItem, FormControl, InputLabel,
  TextField, Box, Typography, CircularProgress, Alert, Chip,
} from '@mui/material';
import { WarningAmberOutlined } from '@mui/icons-material';
import { changeUserRole } from '../usersSlice';
import RoleBadge from '../../../components/common/RoleBadge';
import { USER_ROLES, ROLE_PERMISSIONS } from '../../../constants/roles';

export default function RoleChangeDialog({ open, user, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((s) => s.users);
  const [newRole, setNewRole] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) { setNewRole(''); setReason(''); }
  }, [open]);

  const availableRoles = USER_ROLES.filter((r) => r.value !== user?.role);
  const previewPermissions = newRole ? (ROLE_PERMISSIONS[newRole] || []) : [];

  const handleConfirm = async () => {
    if (!newRole) return;
    const result = await dispatch(changeUserRole({ id: user.id, data: { role: newRole, reason } }));
    if (changeUserRole.fulfilled.match(result)) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>Change User Role</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>Current role:</Typography>
          <RoleBadge role={user?.role} />
          <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>for</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user?.name || user?.fullName}</Typography>
        </Box>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>New Role</InputLabel>
          <Select label="New Role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            {availableRoles.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  {r.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {newRole && (
          <Box sx={{ background: '#F7F6F3', border: '1px solid #E3E1DA', borderRadius: '8px', p: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#5A5A56', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Capabilities for {USER_ROLES.find(r => r.value === newRole)?.label}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {previewPermissions.map((p) => (
                <Chip key={p} label={p.replace(/_/g, ' ')} size="small"
                  sx={{ fontSize: 9, height: 18, background: '#FFFFFF', border: '1px solid #E3E1DA' }} />
              ))}
            </Box>
          </Box>
        )}

        <TextField
          size="small" fullWidth multiline rows={2}
          label="Reason (recommended)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />}
          sx={{ borderRadius: '8px', fontSize: 12 }}>
          This will immediately change user access. The user will need to log in again for changes to take effect.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit" disabled={actionLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm} variant="contained" size="small"
          disabled={!newRole || actionLoading}
          sx={{ background: '#BA7517', '&:hover': { background: '#9a6012' } }}
        >
          {actionLoading ? <CircularProgress size={15} color="inherit" /> : 'Confirm Role Change'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
