import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { AI_SEARCH } from '../../api/endpoints';
import toast from 'react-hot-toast';

export const searchLeads = createAsyncThunk(
  'aiSearch/searchLeads',
  async (query, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(AI_SEARCH.SEARCH, { query });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'AI search failed');
    }
  }
);

export const bulkCreateLeads = createAsyncThunk(
  'aiSearch/bulkCreateLeads',
  async (selectedItems, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(AI_SEARCH.BULK_CREATE, { leads: selectedItems });
      toast.success(`${selectedItems.length} leads added successfully`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Bulk create failed');
    }
  }
);

const aiSearchSlice = createSlice({
  name: 'aiSearch',
  initialState: {
    results: [],
    loading: false,
    error: null,
    selectedIds: [],
    bulkCreateLoading: false,
    lastQuery: '',
  },
  reducers: {
    toggleSelected(state, action) {
      const id = action.payload;
      const idx = state.selectedIds.indexOf(id);
      if (idx === -1) {
        state.selectedIds.push(id);
      } else {
        state.selectedIds.splice(idx, 1);
      }
    },
    selectAll(state) {
      state.selectedIds = state.results
        .filter((r) => !r.existsInCrm)
        .map((r) => r.id || r.companyName);
    },
    clearSelected(state) {
      state.selectedIds = [];
    },
    clearResults(state) {
      state.results = [];
      state.selectedIds = [];
      state.lastQuery = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchLeads.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.results = [];
        state.selectedIds = [];
        state.lastQuery = action.meta.arg;
      })
      .addCase(searchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.results = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(searchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(bulkCreateLeads.pending, (state) => { state.bulkCreateLoading = true; })
      .addCase(bulkCreateLeads.fulfilled, (state) => {
        state.bulkCreateLoading = false;
        state.selectedIds = [];
        state.results = [];
      })
      .addCase(bulkCreateLeads.rejected, (state, action) => {
        state.bulkCreateLoading = false;
        state.error = action.payload;
      });
  },
});

export const { toggleSelected, selectAll, clearSelected, clearResults } = aiSearchSlice.actions;
export default aiSearchSlice.reducer;
