import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress,
} from '@mui/material';
import { toggleUserActive } from '../usersSlice';
import UserAvatar from '../../../components/common/UserAvatar';

export default function ToggleActiveDialog({ open, user, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((s) => s.users);
  const isActive = user?.isActive ?? user?.active ?? true;
  const name = user?.name || user?.fullName || 'this user';

  const handleConfirm = async () => {
    const result = await dispatch(toggleUserActive({ id: user.id, name, activate: !isActive }));
    if (toggleUserActive.fulfilled.match(result)) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>
        {isActive ? 'Deactivate User' : 'Activate User'}
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5,
          background: '#F7F6F3', border: '1px solid #E3E1DA', borderRadius: '10px', p: 2 }}>
          <UserAvatar name={name} size="md" />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{name}</Typography>
            <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>{user?.email}</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', borderRadius: 999,
              padding: '3px 10px', fontSize: 11, fontWeight: 600,
              background: isActive ? '#EAF3DE' : '#FCEBEB',
              color: isActive ? '#3B6D11' : '#A32D2D',
            }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 13, color: '#1A1A18' }}>
          {isActive
            ? `Deactivating ${name} will immediately revoke their CRM access. They will not be able to log in until reactivated.`
            : `Activating ${name} will restore their CRM access immediately.`}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit" disabled={actionLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm} variant="contained" size="small" disabled={actionLoading}
          sx={{
            background: isActive ? '#A32D2D' : '#3B6D11',
            '&:hover': { background: isActive ? '#832424' : '#2d5409' },
          }}
        >
          {actionLoading
            ? <CircularProgress size={15} color="inherit" />
            : isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
