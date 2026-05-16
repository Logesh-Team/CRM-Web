import { Box, MenuItem, TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setDemoFilters } from '../features/demos/demosSlice';

const STATUSES = ['All', 'SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];
const STATUS_LABELS = {
  All: 'All', SCHEDULED: 'Scheduled', COMPLETED: 'Completed',
  NO_SHOW: 'No Show', CANCELLED: 'Cancelled',
};

export default function CalendarFilters() {
  const dispatch = useDispatch();
  const { filters, demos } = useSelector(s => s.demos);

  const assignees = ['All', ...new Set(demos.map(d => d.assignedTo).filter(Boolean))];
  const assigneeNames = ['All', ...new Set(demos.map(d => d.assignedToName).filter(Boolean))];

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <TextField
        select label="Presenter" size="small" sx={{ width: 180, fontSize: 13 }}
        value={filters.assignedTo || 'All'}
        onChange={e => dispatch(setDemoFilters({ assignedTo: e.target.value }))}
      >
        {assigneeNames.map((name, i) => (
          <MenuItem key={i} value={i === 0 ? 'All' : assignees[i]} sx={{ fontSize: 13 }}>
            {name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select label="Status" size="small" sx={{ width: 180, fontSize: 13 }}
        value={filters.status || 'All'}
        onChange={e => dispatch(setDemoFilters({ status: e.target.value }))}
      >
        {STATUSES.map(s => (
          <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{STATUS_LABELS[s]}</MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
