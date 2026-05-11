import React from "react";
import { Box } from "@mui/material";

export default function SchedulerLayout({ children }) {
  return (
    <Box sx={{
      display: "flex",
      height: "100vh",
      background: "#f3f5f7",
    }}>
      <Box sx={{
        flex: 1,
        ml: 2,
        bgcolor: "white",
        borderRadius: 4,
        p: 2,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}>
        {children}
      </Box>
    </Box>
  );
}