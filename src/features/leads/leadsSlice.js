import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { LEADS } from '../../api/endpoints';

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(LEADS.LIST, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leads');
    }
  }
);

export const fetchLeadById = createAsyncThunk(
  'leads/fetchLeadById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(LEADS.GET_BY_ID(id));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch lead');
    }
  }
);

export const createLead = createAsyncThunk(
  'leads/createLead',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(LEADS.CREATE, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create lead');
    }
  }
);

export const updateLead = createAsyncThunk(
  'leads/updateLead',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(LEADS.UPDATE(id), data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update lead');
    }
  }
);

export const updateLeadStatus = createAsyncThunk(
  'leads/updateLeadStatus',
  async ({ id, newStatus, reason }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(LEADS.UPDATE_STATUS(id), { newStatus, reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const assignLead = createAsyncThunk(
  'leads/assignLead',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(LEADS.ASSIGN(id), { userId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign lead');
    }
  }
);

export const softDeleteLead = createAsyncThunk(
  'leads/softDeleteLead',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(LEADS.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete lead');
    }
  }
);

export const fetchLeadActivities = createAsyncThunk(
  'leads/fetchLeadActivities',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(LEADS.ACTIVITIES(id));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activities');
    }
  }
);

export const logActivity = createAsyncThunk(
  'leads/logActivity',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(LEADS.LOG_ACTIVITY(id), data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to log activity');
    }
  }
);

const leadsSlice = createSlice({
  name: 'leads',
  initialState: {
    leads: [],
    selectedLead: null,
    activities: [],
    loading: false,
    activitiesLoading: false,
    error: null,
    pagination: {
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    },
    filters: {
      status: '',
      grade: '',
      priority: '',
      city: '',
      assignedTo: '',
      search: '',
    },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 0;
    },
    resetFilters(state) {
      state.filters = { status: '', grade: '', priority: '', city: '', assignedTo: '', search: '' };
      state.pagination.page = 0;
    },
    setPage(state, action) {
      state.pagination.page = action.payload;
    },
    clearSelectedLead(state) {
      state.selectedLead = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (payload && payload.content) {
          state.leads = payload.content;
          state.pagination = {
            page: payload.number ?? 0,
            size: payload.size ?? 20,
            totalElements: payload.totalElements ?? 0,
            totalPages: payload.totalPages ?? 0,
          };
        } else {
          state.leads = Array.isArray(payload) ? payload : [];
        }
      })
      .addCase(fetchLeads.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchLeadById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchLeadById.fulfilled, (state, action) => { state.loading = false; state.selectedLead = action.payload; })
      .addCase(fetchLeadById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createLead.fulfilled, (state, action) => { state.leads.unshift(action.payload); })
      .addCase(updateLead.fulfilled, (state, action) => {
        const idx = state.leads.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.leads[idx] = action.payload;
        if (state.selectedLead?.id === action.payload.id) state.selectedLead = action.payload;
      })
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        const idx = state.leads.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.leads[idx] = action.payload;
        if (state.selectedLead?.id === action.payload.id) state.selectedLead = action.payload;
      })
      .addCase(softDeleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter((l) => l.id !== action.payload);
      })

      .addCase(fetchLeadActivities.pending, (state) => { state.activitiesLoading = true; })
      .addCase(fetchLeadActivities.fulfilled, (state, action) => {
        state.activitiesLoading = false;
        state.activities = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchLeadActivities.rejected, (state) => { state.activitiesLoading = false; })

      .addCase(logActivity.fulfilled, (state, action) => {
        state.activities.unshift(action.payload);
      });
  },
});

export const { setFilters, resetFilters, setPage, clearSelectedLead } = leadsSlice.actions;
export default leadsSlice.reducer;
