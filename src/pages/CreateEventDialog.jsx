import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { addEvent } from "../features/scheduler/schedulerSlice";

export default function CreateEventDialog({ open, onClose }) {
  const dispatch = useDispatch();

  // 🧠 Mock CRM Master Data (later from API)
  const companies = [
    {
      id: "c1",
      name: "Acme Pvt Ltd",
      location: "Chennai",
      contacts: ["John Smith", "Priya Kumar"],
    },
    {
      id: "c2",
      name: "Globex Corporation",
      location: "Bangalore",
      contacts: ["Michael Scott", "Dwight Schrute"],
    },
  ];

  const salesUsers = ["Darlene Robertson", "Guy Hawkins", "Esther Howard"];
  const demoUsers = ["Marvin McKinney", "Brooklyn Simmons", "Kathryn Murphy"];

  // 🧾 Form State
  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
    company: "",
    contact: "",
    location: "",
    meetingType: "Demo",
    salesRep: "",
    demoBy: "",
    status: "Scheduled",
  });

  // 🔍 Find contacts based on selected company
  const selectedCompany = companies.find((c) => c.name === form.company);
  const contacts = selectedCompany ? selectedCompany.contacts : [];

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // 💾 SAVE EVENT
  const handleSave = () => {
    dispatch(
      addEvent({
        title: form.title,
        start: form.start,
        end: form.end,
        extendedProps: {
          description: form.description,
          company: form.company,
          contact: form.contact,
          location: form.location,
          meetingType: form.meetingType,
          salesRep: form.salesRep,
          demoBy: form.demoBy,
          status: form.status,
        },
      })
    );

    // reset + close dialog
    onClose();
    setForm({
      title: "",
      start: "",
      end: "",
      description: "",
      company: "",
      contact: "",
      location: "",
      meetingType: "Demo",
      salesRep: "",
      demoBy: "",
      status: "Scheduled",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Demo Meeting</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>

          {/* Meeting Title */}
          <TextField
            label="Meeting Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
          />

          {/* Start */}
          <TextField
            type="datetime-local"
            label="Start Time"
            name="start"
            InputLabelProps={{ shrink: true }}
            value={form.start}
            onChange={handleChange}
          />

          {/* End */}
          <TextField
            type="datetime-local"
            label="End Time"
            name="end"
            InputLabelProps={{ shrink: true }}
            value={form.end}
            onChange={handleChange}
          />

          {/* Company */}
          <TextField
            select
            label="Company"
            name="company"
            value={form.company}
            onChange={(e) => {
              const companyName = e.target.value;
              const companyObj = companies.find((c) => c.name === companyName);

              setForm({
                ...form,
                company: companyName,
                contact: "",
                location: companyObj?.location || "",
              });
            }}
            SelectProps={{ native: true }}
          >
            <option value="" />
            {companies.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </TextField>

          {/* Contact */}
          <TextField
            select
            label="Contact Person"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            SelectProps={{ native: true }}
            disabled={!form.company}
          >
            <option value="" />
            {contacts.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </TextField>

          {/* Location */}
          <TextField
            label="Demo Location"
            name="location"
            value={form.location}
            onChange={handleChange}
          />

          {/* Sales Rep */}
          <TextField
            select
            label="Sales Rep"
            name="salesRep"
            value={form.salesRep}
            onChange={handleChange}
            SelectProps={{ native: true }}
          >
            <option value="" />
            {salesUsers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </TextField>

          {/* Demo Given By */}
          <TextField
            select
            label="Demo Given By"
            name="demoBy"
            value={form.demoBy}
            onChange={handleChange}
            SelectProps={{ native: true }}
          >
            <option value="" />
            {demoUsers.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </TextField>

          {/* Status */}
          <TextField
            select
            label="Meeting Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            SelectProps={{ native: true }}
          >
            <option>Scheduled</option>
            <option>Completed</option>
            <option>No Show</option>
            <option>Cancelled</option>
          </TextField>

          {/* Description */}
          <TextField
            label="Description / Notes"
            name="description"
            multiline
            rows={3}
            value={form.description}
            onChange={handleChange}
            fullWidth
          />

        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Meeting
        </Button>
      </DialogActions>
    </Dialog>
  );
}