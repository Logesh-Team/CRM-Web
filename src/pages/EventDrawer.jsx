import React, { useEffect, useState } from "react";
import {
  Drawer, TextField, Button, Stack, Typography
} from "@mui/material";
import { useDispatch } from "react-redux";
import { updateEvent, deleteEvent } from "../features/scheduler/schedulerSlice";

export default function EventDrawer({ event, onClose }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    description: ""
  });

  // Load event data into form
  useEffect(() => {
    if (!event) return;

    setForm({
      title: event.title,
      start: event.startStr?.slice(0, 16),
      end: event.endStr?.slice(0, 16),
      description: event.extendedProps?.description || ""
    });
  }, [event]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ UPDATE EVENT
  const handleUpdate = () => {
    dispatch(updateEvent({
      id: event.id,
      title: form.title,
      start: form.start,
      end: form.end,
      extendedProps: {
        description: form.description
      }
    }));

    onClose();
  };

  // 🗑️ DELETE EVENT
  const handleDelete = () => {
    if (!window.confirm("Delete this meeting?")) return;

    dispatch(deleteEvent(event.id));
    onClose();
  };

  return (
    <Drawer anchor="right" open={!!event} onClose={onClose}>
      <Stack spacing={2} p={3} width={360}>
        <Typography variant="h6">Edit Meeting</Typography>

        <TextField
          label="Meeting Title"
          name="title"
          value={form.title}
          onChange={handleChange}
        />

        <TextField
          type="datetime-local"
          label="Start Time"
          name="start"
          InputLabelProps={{ shrink: true }}
          value={form.start}
          onChange={handleChange}
        />

        <TextField
          type="datetime-local"
          label="End Time"
          name="end"
          InputLabelProps={{ shrink: true }}
          value={form.end}
          onChange={handleChange}
        />

        <TextField
          label="Description"
          name="description"
          multiline
          rows={3}
          value={form.description}
          onChange={handleChange}
        />

        <Stack direction="row" spacing={2}>
          <Button variant="contained" fullWidth onClick={handleUpdate}>
            Save Changes
          </Button>

          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}