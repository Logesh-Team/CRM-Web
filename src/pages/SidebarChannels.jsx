import React from "react";
import {
  Box, Typography, Avatar, Button, Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const users = [
  "Kristin Watson",
  "Floyd Miles",
  "Devon Lane",
  "Cameron Williamson"
];

export default function SidebarChannels() {
  return (
    <Box sx={{
      width: 260,
      bgcolor: "white",
      borderRadius: 4,
      p: 2,
      boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
    }}>
      <Typography variant="h6" fontWeight={600}>Channels</Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        fullWidth
        sx={{ mt: 2, mb: 2 }}
      >
        Create Post
      </Button>

      <Stack spacing={2}>
        {users.map((name, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar>{name[0]}</Avatar>
            <Typography variant="body2">{name}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}