import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function SchedulerHeader({ onCreate }) {
  return (
    <Box
      sx={{
        mb: 1,
        p: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={600}>
          Demo Scheduler
        </Typography>
        <Typography variant="body2">
          Manage demos, meetings & customer calls
        </Typography>
      </Box>

      <Button
        variant="contained"
        sx={{ bgcolor: "black", color: "white" }}
        startIcon={<AddIcon />}
        onClick={onCreate}
      >
        New Meeting
      </Button>
    </Box>
  );
}