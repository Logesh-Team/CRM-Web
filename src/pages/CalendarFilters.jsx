import { Box, MenuItem, TextField } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setFilters } from "../features/scheduler/schedulerSlice";

export default function CalendarFilters() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.scheduler.filters);
  const events = useSelector((s) => s.scheduler.events);

  // dynamic dropdown values from events
  const salesReps = [
    "All",
    ...new Set(events.map((e) => e.extendedProps?.salesRep).filter(Boolean)),
  ];

  const statuses = ["All", "Scheduled", "Completed", "No Show", "Cancelled"];

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      <TextField
        select
        label="Sales Rep"
        size="small"
        sx={{ width: 180 }}
        value={filters.salesRep}
        onChange={(e) => dispatch(setFilters({ salesRep: e.target.value }))}
      >
        {salesReps.map((rep) => (
          <MenuItem key={rep} value={rep}>
            {rep}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Status"
        size="small"
        sx={{ width: 180 }}
        value={filters.status}
        onChange={(e) => dispatch(setFilters({ status: e.target.value }))}
      >
        {statuses.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}