import { Grid, Paper, Typography } from "@mui/material";

const stats = [
  { label: "Today Meetings", value: 8 },
  { label: "Upcoming Demos", value: 14 },
  { label: "Completed", value: 32 },
  { label: "No Shows", value: 3 },
];

export default function StatsCards() {
  return (
    <Grid container spacing={2} mb={2}>
      {stats.map((s, i) => (
        <Grid item xs={3} key={i}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow:5}}>
            <Typography variant="body2" color="text.secondary">
              {s.label}
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {s.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}