import React, { useState } from 'react';
import {
  Box, Card, Typography, Select, MenuItem,
  FormControl, InputLabel, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import ReportLayout from './ReportLayout';
import { formatDate } from '../../utils/formatDate';

const LEAD_STATUSES = [
  'NEW', 'AI_CALL_SCHEDULED', 'AI_CALL_DONE_INTERESTED', 'AI_CALL_DONE_NOT_INTERESTED',
  'IN_FOLLOW_UP', 'DEMO_SCHEDULED', 'DEMO_DONE', 'QUOTATION_SENT',
  'NEGOTIATION', 'CONVERTED_WON', 'CLOSED_LOST', 'ON_HOLD',
];

function OverdueDaysChip({ days }) {
  let color, bg;
  if (days > 7)       { color = '#A32D2D'; bg = '#FCEBEB'; }
  else if (days >= 4) { color = '#BA7517'; bg = '#FAEEDA'; }
  else                { color = '#3B6D11'; bg = '#EAF3DE'; }
  return (
    <Chip
      label={`${days}d`}
      size="small"
      sx={{
        fontSize: 11, fontWeight: 700, height: 22,
        background: bg, color, border: 'none',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

const HEADER_SX = {
  fontSize: 11, fontWeight: 700, color: '#5A5A56', textTransform: 'uppercase',
  letterSpacing: '0.04em', whiteSpace: 'nowrap',
};
const CELL_SX = { fontSize: 13, color: '#1A1A18' };

export default function OverdueFollowUpReport() {
  const navigate = useNavigate();

  const [leadStatus, setLeadStatus]   = useState('');
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [generated, setGenerated]     = useState(false);

  const [reassignOpen, setReassignOpen]   = useState(false);
  const [reassignRow, setReassignRow]     = useState(null);
  const [users, setUsers]                 = useState([]);
  const [selectedUser, setSelectedUser]   = useState('');
  const [usersLoading, setUsersLoading]   = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(true);
    axiosInstance
      .get('/reports/overdue-followup', {
        params: {
          ...(leadStatus && { leadStatus }),
        },
      })
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.content || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const openReassign = (row) => {
    setReassignRow(row);
    setSelectedUser('');
    setReassignOpen(true);
    if (users.length === 0) {
      setUsersLoading(true);
      axiosInstance
        .get('/users')
        .then(r => {
          const d = r.data?.data;
          setUsers(Array.isArray(d) ? d : d?.content || []);
        })
        .catch(() => setUsers([]))
        .finally(() => setUsersLoading(false));
    }
  };

  const handleReassignConfirm = () => {
    if (!selectedUser || !reassignRow) return;
    axiosInstance
      .patch(`/leads/${reassignRow.leadId}/assign`, { userId: selectedUser })
      .catch(() => {})
      .finally(() => {
        setReassignOpen(false);
        setReassignRow(null);
      });
  };

  const filterBar = (
    <>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Lead Status</InputLabel>
        <Select value={leadStatus} onChange={e => setLeadStatus(e.target.value)} label="Lead Status">
          <MenuItem value="" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
          {LEAD_STATUSES.map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s.replace(/_/g, ' ')}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  return (
    <>
      <ReportLayout
        title="Overdue Follow-Up Report"
        description="Leads whose next follow-up date has passed and require immediate attention."
        reportKey="overdue-followup"
        filterBar={filterBar}
        onGenerate={handleGenerate}
        loading={loading}
        hasData={generated && data.length > 0}
      >
        <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: '#F7F6F3' }}>
                  {['Company', 'Contact', 'Mobile', 'Status', 'Assigned To', 'Next Follow-Up', 'Days Overdue', 'Action'].map(h => (
                    <TableCell key={h} sx={HEADER_SX}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i} sx={{ '&:hover': { background: '#F7F6F3' } }}>
                    <TableCell sx={{ ...CELL_SX, fontWeight: 500 }}>{row.companyName || '—'}</TableCell>
                    <TableCell sx={CELL_SX}>{row.primaryContactName || '—'}</TableCell>
                    <TableCell sx={{ ...CELL_SX, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                      {row.mobile || '—'}
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', borderRadius: 999,
                        padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        background: '#E6F1FB', color: '#185FA5',
                      }}>
                        {row.leadStatus ? row.leadStatus.replace(/_/g, ' ') : '—'}
                      </span>
                    </TableCell>
                    <TableCell sx={CELL_SX}>{row.assignedTo || '—'}</TableCell>
                    <TableCell sx={CELL_SX}>{row.nextFollowUpDate ? formatDate(row.nextFollowUpDate) : '—'}</TableCell>
                    <TableCell sx={CELL_SX}>
                      <OverdueDaysChip days={row.daysOverdue ?? 0} />
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/leads/${row.leadId}`)}
                          sx={{
                            fontSize: 11, py: 0.25, px: 1,
                            borderColor: '#E3E1DA', color: '#185FA5',
                            '&:hover': { borderColor: '#185FA5' },
                          }}
                        >
                          View Lead
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openReassign(row)}
                          sx={{
                            fontSize: 11, py: 0.25, px: 1,
                            borderColor: '#E3E1DA', color: '#5A5A56',
                            '&:hover': { borderColor: '#5A5A56' },
                          }}
                        >
                          Reassign
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </ReportLayout>

      <Dialog open={reassignOpen} onClose={() => setReassignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>
          Reassign Lead
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {reassignRow && (
            <Typography sx={{ fontSize: 13, color: '#5A5A56', mb: 2 }}>
              Reassigning <strong style={{ color: '#1A1A18' }}>{reassignRow.companyName}</strong>
            </Typography>
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Assign To</InputLabel>
            <Select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              label="Assign To"
              disabled={usersLoading}
            >
              {usersLoading && (
                <MenuItem disabled sx={{ fontSize: 13 }}>Loading users…</MenuItem>
              )}
              {users.map(u => (
                <MenuItem key={u.id || u.userId} value={u.id || u.userId} sx={{ fontSize: 13 }}>
                  {u.fullName || u.name || u.email || u.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setReassignOpen(false)} sx={{ fontSize: 12 }}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleReassignConfirm}
            disabled={!selectedUser}
            sx={{ fontSize: 12 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
