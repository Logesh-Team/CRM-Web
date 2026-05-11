import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import EventDialog from "./EventDialog";
import { useSelector } from "react-redux";
import SchedulerLayout from "./SchedulerLayout";
import SchedulerHeader from "./SchedulerHeader";
import StatsCards from "./StatsCards";
import CalendarFilters from "./CalendarFilters";
import CreateEventDialog from "./CreateEventDialog";
import { openDialog, updateEvent } from "../features/scheduler/schedulerSlice";
import { useDispatch } from "react-redux";

export default function SchedulerPage() {
 const { events, filters } = useSelector((s) => s.scheduler);

const filteredEvents = events.filter((event) => {
  const repMatch =
    filters.salesRep === "All" ||
    event.extendedProps?.salesRep === filters.salesRep;

  const statusMatch =
    filters.status === "All" ||
    event.extendedProps?.status === filters.status;

  return repMatch && statusMatch;
});
  const [openCreate, setOpenCreate] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      events.forEach((event) => {
        const end = new Date(event.end);
        const status = event.extendedProps?.status;

        if (end < now && status === "Scheduled") {
          dispatch(
            updateEvent({
              ...event,
              extendedProps: {
                ...event.extendedProps,
                status: "Completed",
              },
            }),
          );
        }
      });
    }, 60000); // check every 1 min

    return () => clearInterval(interval);
  }, [events, dispatch]);

  return (
    <SchedulerLayout>
      <SchedulerHeader onCreate={() => setOpenCreate(true)} />
      <StatsCards />
      <CalendarFilters />

      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={filteredEvents}
        height="65vh"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
        }}
        eventDidMount={(info) => {
          const status = info.event.extendedProps.status;

          const colors = {
            Scheduled: "#1976d2",
            Completed: "#2e7d32",
            Cancelled: "#d32f2f",
            "No Show": "#ed6c02",
          };

          info.el.style.borderLeft = `4px solid ${colors[status]}`;
        }}
        eventClick={(info) => {
          const event = info.event;

          dispatch(
            openDialog({
              id: event.id,
              title: event.title,
              start: event.startStr,
              end: event.endStr,
              extendedProps: event.extendedProps,
            }),
          );
        }}
      />


      <CreateEventDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
      />
      <EventDialog />

    </SchedulerLayout>
  );
}
     
