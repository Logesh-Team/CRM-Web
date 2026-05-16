import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { DEMOS } from '../../api/endpoints';

export const fetchDemos = createAsyncThunk('demos/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(DEMOS.LIST, { params });
    return res.data?.data || [];
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load demos');
  }
});

export const fetchDemoById = createAsyncThunk('demos/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(DEMOS.GET_BY_ID(id));
    return res.data?.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load demo');
  }
});

export const fetchDemosByLead = createAsyncThunk('demos/fetchByLead', async (leadId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(DEMOS.LIST, { params: { leadId } });
    return res.data?.data || [];
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load demos');
  }
});

export const fetchUpcomingDemos = createAsyncThunk('demos/fetchUpcoming', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(DEMOS.LIST, { params: { upcoming: true } });
    return res.data?.data || [];
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load upcoming demos');
  }
});

export const scheduleDemo = createAsyncThunk('demos/schedule', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(DEMOS.CREATE, data);
    return res.data?.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to schedule demo');
  }
});

export const updateDemo = createAsyncThunk('demos/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(DEMOS.UPDATE(id), data);
    return res.data?.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update demo');
  }
});

export const cancelDemo = createAsyncThunk('demos/cancel', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(DEMOS.CANCEL(id), { reason });
    return res.data?.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to cancel demo');
  }
});

export const postDemo = createAsyncThunk('demos/postDemo', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(DEMOS.POST_DEMO(id), data);
    return res.data?.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to record post-demo');
  }
});

export const markNoShow = createAsyncThunk('demos/noShow', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(DEMOS.NO_SHOW(id));
    return res.data?.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to mark no-show');
  }
});

const demosSlice = createSlice({
  name: 'demos',
  initialState: {
    demos: [],
    selectedDemo: null,
    upcomingDemos: [],
    leadDemos: [],
    loading: false,
    error: null,
    dialogOpen: false,
    filters: { status: 'All', assignedTo: 'All' },
  },
  reducers: {
    openDemoDialog: (state, action) => {
      state.dialogOpen = true;
      state.selectedDemo = action.payload || null;
    },
    closeDemoDialog: (state) => {
      state.dialogOpen = false;
      state.selectedDemo = null;
    },
    setDemoFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearDemoError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDemos.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDemos.fulfilled, (state, action) => {
        state.loading = false;
        state.demos = action.payload;
      })
      .addCase(fetchDemos.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })

      .addCase(fetchDemoById.fulfilled, (state, action) => {
        state.selectedDemo = action.payload;
      })

      .addCase(fetchDemosByLead.fulfilled, (state, action) => {
        state.leadDemos = action.payload;
      })

      .addCase(fetchUpcomingDemos.fulfilled, (state, action) => {
        state.upcomingDemos = action.payload;
      })

      .addCase(scheduleDemo.fulfilled, (state, action) => {
        state.demos.unshift(action.payload);
        state.selectedDemo = action.payload;
      })

      .addCase(updateDemo.fulfilled, (state, action) => {
        const idx = state.demos.findIndex(d => d.id === action.payload.id);
        if (idx >= 0) state.demos[idx] = action.payload;
        if (state.selectedDemo?.id === action.payload.id) state.selectedDemo = action.payload;
      })

      .addCase(cancelDemo.fulfilled, (state, action) => {
        const idx = state.demos.findIndex(d => d.id === action.payload.id);
        if (idx >= 0) state.demos[idx] = action.payload;
        if (state.selectedDemo?.id === action.payload.id) state.selectedDemo = action.payload;
      })

      .addCase(postDemo.fulfilled, (state, action) => {
        const idx = state.demos.findIndex(d => d.id === action.payload.id);
        if (idx >= 0) state.demos[idx] = action.payload;
        if (state.selectedDemo?.id === action.payload.id) state.selectedDemo = action.payload;
      })

      .addCase(markNoShow.fulfilled, (state, action) => {
        const idx = state.demos.findIndex(d => d.id === action.payload.id);
        if (idx >= 0) state.demos[idx] = action.payload;
        if (state.selectedDemo?.id === action.payload.id) state.selectedDemo = action.payload;
      });
  },
});

export const { openDemoDialog, closeDemoDialog, setDemoFilters, clearDemoError } = demosSlice.actions;
export default demosSlice.reducer;
