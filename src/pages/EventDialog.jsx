import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  TextField,
  Button,
  Stack,
  Typography,
  Divider,
  Link,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  closeDialog,
} from "../features/scheduler/schedulerSlice";
import { formatDateTime } from "../utils/dateFormat";

export default function EventDialog() {
  const dispatch = useDispatch();
  const { dialogOpen, selectedEvent } = useSelector((s) => s.scheduler);

  const [isEditMode, setIsEditMode] = useState(false);

  const initialFormRef = useRef(null);
  const resetForm = () => {
    if (initialFormRef.current) {
      setForm(initialFormRef.current);
    }
    setIsEditMode(false);
  };
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

  const DetailRow = ({ label, value }) => {
    const isLink =
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"));

    return (
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>

        {isLink ? (
          <Link
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              fontWeight: 500,
              fontSize: "0.95rem",
              color: "#2563eb",
              "&:hover": {
                color: "#1d4ed8",
                textDecoration: "underline",
              },
            }}
          >
            {value}
          </Link>
        ) : (
          <Typography variant="body1" fontWeight={500}>
            {value || "-"}
          </Typography>
        )}
      </Stack>
    );
  };
  const salesUsers = ["Darlene Robertson", "Guy Hawkins", "Esther Howard"];
  const demoUsers = ["Marvin McKinney", "Brooklyn Simmons", "Kathryn Murphy"];

  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
    company: "",
    contact: "",
    location: "",
    salesRep: "",
    demoBy: "",
    status: "Scheduled",
  });

  const selectedCompany = companies.find((c) => c.name === form.company);
  const contacts = selectedCompany ? selectedCompany.contacts : [];

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toDateTimeLocal = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");

    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  };

  // 🔹 Load event
  useEffect(() => {
    if (!selectedEvent) return;

    const newForm = {
      title: selectedEvent.title || "",
      start: toDateTimeLocal(selectedEvent.start),
      end: toDateTimeLocal(selectedEvent.end),
      description: selectedEvent.extendedProps?.description || "",
      company: selectedEvent.extendedProps?.company || "",
      contact: selectedEvent.extendedProps?.contact || "",
      location: selectedEvent.extendedProps?.location || "",
      salesRep: selectedEvent.extendedProps?.salesRep || "",
      demoBy: selectedEvent.extendedProps?.demoBy || "",
      status: selectedEvent.extendedProps?.status || "Scheduled",
    };

    setForm(newForm);
    setIsEditMode(false);

    // store original snapshot
    initialFormRef.current = newForm;
  }, [selectedEvent]);

  // 🔹 check changes
  const hasChanges = () => {
    if (!initialFormRef.current) return true;

    return JSON.stringify(initialFormRef.current) !== JSON.stringify(form);
  };

  // SAVE
  const handleSave = () => {
    // 🚫 prevent save if nothing changed
    if (!hasChanges()) {
      setIsEditMode(false);
      return;
    }

    const payload = {
      title: form.title,
      start: form.start,
      end: form.end,
      extendedProps: {
        description: form.description,
        company: form.company,
        contact: form.contact,
        location: form.location,
        salesRep: form.salesRep,
        demoBy: form.demoBy,
        status: form.status,
      },
    };

    // 🔁 UPDATE or ADD
    if (selectedEvent) {
      dispatch(updateEvent({ ...payload, id: selectedEvent.id }));
    } else {
      dispatch(addEvent({ ...payload, id: Date.now().toString() }));
    }

    // ✅ update baseline snapshot so future changes compare correctly
    initialFormRef.current = form;

    // 🚪 exit edit mode + close drawer
    setIsEditMode(false);
    dispatch(closeDialog());
  };
  const handleDelete = () => {
    if (!window.confirm("Delete this meeting?")) return;
    dispatch(deleteEvent(selectedEvent.id));
    dispatch(closeDialog());
  };

  return (
    <Drawer
      anchor="right"
      open={dialogOpen}
      onClose={() => dispatch(closeDialog())}
    >
      <Stack spacing={2} p={3} width={420}>
        <Typography variant="h5">Meeting Details</Typography>
        <Divider />

        {/* VIEW MODE */}
        {!isEditMode && (
          <>
            <DetailRow label="Title" value={form.title} />
            <DetailRow label="Start Time" value={formatDateTime(form.start)} />
            <DetailRow label="End Time" value={formatDateTime(form.end)} />
            <DetailRow
              label="Meet Link"
              value="https://meet.google.com/abc-defg-hij"
            />
            <Divider />

            <DetailRow label="Company" value={form.company} />
            <DetailRow label="Contact Person" value={form.contact} />
            <DetailRow label="Location" value={form.location} />
            <Divider />

            <DetailRow label="Sales Representative" value={form.salesRep} />
            <DetailRow label="Demo By" value={form.demoBy} />
            <DetailRow label="Status" value={form.status} />
            <DetailRow label="Description" value={form.description} />

            <Button variant="contained" onClick={() => setIsEditMode(true)}>
              Edit Meeting
            </Button>
          </>
        )}

        {/* EDIT MODE */}
        {isEditMode && (
          <>
            <TextField
              label="Title"
              name="title"
              value={form.title}
              onChange={handleChange}
            />

            <TextField
              type="datetime-local"
              name="start"
              value={form.start}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="datetime-local"
              name="end"
              value={form.end}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Company"
              name="company"
              value={form.company}
              onChange={(e) => {
                const companyName = e.target.value;
                const companyObj = companies.find(
                  (c) => c.name === companyName,
                );

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
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </TextField>

            <TextField
              select
              name="contact"
              value={form.contact}
              onChange={handleChange}
              SelectProps={{ native: true }}
            >
              <option value="" />
              {contacts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </TextField>

            <TextField
              label="Location"
              name="location"
              value={form.location}
              onChange={handleChange}
            />

            <TextField
              select
              name="salesRep"
              value={form.salesRep}
              onChange={handleChange}
              SelectProps={{ native: true }}
            >
              <option value="" />
              {salesUsers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextField>

            <TextField
              select
              name="demoBy"
              value={form.demoBy}
              onChange={handleChange}
              SelectProps={{ native: true }}
            >
              <option value="" />
              {demoUsers.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </TextField>

            <TextField
              select
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

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
            />

            {/* 🔥 SAVE BUTTON BLOCKED IF NO CHANGE */}
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges()}
            >
              Save Changes
            </Button>

            <Button color="error" onClick={handleDelete}>
              Delete Meeting
            </Button>

            <Button onClick={resetForm}>Cancel Edit</Button>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
