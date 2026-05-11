import React from "react";
import {
  Dialog, DialogContent, Typography,
  Button, Stack, Avatar
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch } from "react-redux";
import { deleteEvent } from "../features/scheduler/schedulerSlice";

export default function DeleteConfirm({ open, onClose, eventId }) {
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(deleteEvent(eventId));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent sx={{ textAlign: "center", p: 4 }}>
        <Avatar sx={{ bgcolor: "#ffe5e5", m: "auto", mb: 2 }}>
          <DeleteIcon color="error"/>
        </Avatar>

        <Typography variant="h6" mb={2}>
          Are you sure you want to delete the schedule?
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}