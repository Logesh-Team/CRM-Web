import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDemos, openDemoDialog, setDemoFilters } from '../features/demos/demosSlice';
import SchedulerLayout from './SchedulerLayout';
import SchedulerHeader from './SchedulerHeader';
import StatsCards from './StatsCards';
import CalendarFilters from './CalendarFilters';
import CreateEventDialog from './CreateEventDialog';
import EventDialog from './EventDialog';

const STATUS_COLORS = {
  SCHEDULED: '#185FA5',
  COMPLETED:  '#3B6D11',
  CANCELLED:  '#A32D2D',
  NO_SHOW:    '#BA7517',
};

export default function SchedulerPage() {
  const dispatch = useDispatch();
  const { demos, filters } = useSelector(s => s.demos);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    dispatch(fetchDemos());
  }, [dispatch]);

  const filteredDemos = demos.filter(d => {
    const statusOk = filters.status === 'All' || d.status === filters.status;
    const repOk = filters.assignedTo === 'All' || d.assignedTo === filters.assignedTo;
    return statusOk && repOk;
  });

  const calendarEvents = filteredDemos.map(d => ({
    id: d.id,
    title: d.title + (d.leadCompanyName ? ` — ${d.leadCompanyName}` : ''),
    start: d.scheduledAt,
    end: d.endsAt,
    extendedProps: { demo: d, status: d.status },
  }));

  return (
    <SchedulerLayout>
      <SchedulerHeader onCreate={() => setOpenCreate(true)} />
      <StatsCards />
      <CalendarFilters />

      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={calendarEvents}
        height="65vh"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        eventDidMount={(info) => {
          const status = info.event.extendedProps.status;
          info.el.style.borderLeft = `4px solid ${STATUS_COLORS[status] || '#185FA5'}`;
        }}
        eventClick={(info) => {
          const demo = info.event.extendedProps.demo;
          dispatch(openDemoDialog(demo));
        }}
        dateClick={() => setOpenCreate(true)}
      />

      <CreateEventDialog open={openCreate} onClose={() => setOpenCreate(false)} />
      <EventDialog />
    </SchedulerLayout>
  );
}
