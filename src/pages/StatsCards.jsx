import { Grid, Paper, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

export default function StatsCards() {
  const { demos } = useSelector(s => s.demos);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const stats = [
    {
      label: 'Today\'s Demos',
      value: demos.filter(d => {
        const t = new Date(d.scheduledAt);
        return t >= todayStart && t < todayEnd;
      }).length,
    },
    {
      label: 'Upcoming',
      value: demos.filter(d => d.status === 'SCHEDULED' && new Date(d.scheduledAt) >= now).length,
    },
    {
      label: 'Completed',
      value: demos.filter(d => d.status === 'COMPLETED').length,
    },
    {
      label: 'No Shows',
      value: demos.filter(d => d.status === 'NO_SHOW').length,
    },
  ];

  return (
    <Grid container spacing={2} mb={2}>
      {stats.map((s, i) => (
        <Grid item xs={3} key={i}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
              {s.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ fontFamily: 'DM Mono' }}>
              {s.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
