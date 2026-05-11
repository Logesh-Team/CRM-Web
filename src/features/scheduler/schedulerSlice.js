import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  events: [
    {
      id: "1",
      title: "Standup Meeting",
      start: "2026-05-12T09:30:00",
      end: "2026-05-12T10:00:00",
      extendedProps: {
        description: "Daily CRM Standup",
        salesRep: "Darlene Robertson",
        demoBy: "Marvin McKinney",
        status: "Scheduled",
      },
    },
  ],
  selectedEvent: null,
  dialogOpen: false,

  // ⭐ NEW
  filters: {
    salesRep: "All",
    status: "All",
  },
};

const schedulerSlice = createSlice({
    name: "scheduler",
    initialState,
    reducers: {
        openDialog: (state, action) => {
            state.dialogOpen = true;
            state.selectedEvent = action.payload || null;
        },
        closeDialog: (state) => {
            state.dialogOpen = false;
            state.selectedEvent = null;
        },
        addEvent: {
            reducer: (state, action) => {
                state.events.push(action.payload);
            },
            prepare: (event) => ({
                payload: { id: nanoid(), ...event },
            }),
        },
        updateEvent: (state, action) => {
            const index = state.events.findIndex(e => e.id === action.payload.id);
            state.events[index] = action.payload;
        },
        deleteEvent: (state, action) => {
            state.events = state.events.filter(e => e.id !== action.payload);
        },
        setFilters: (state, action) => {
  state.filters = { ...state.filters, ...action.payload };
},
    },
});

export const {
    openDialog,
    closeDialog,
    addEvent,
    updateEvent,
    deleteEvent,
    setFilters,
} = schedulerSlice.actions;

export default schedulerSlice.reducer;