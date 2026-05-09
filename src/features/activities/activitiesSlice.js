import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { DASHBOARD } from '../../api/endpoints';

export const fetchRecentActivities = createAsyncThunk(
  'activities/fetchRecent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(DASHBOARD.RECENT_ACTIVITIES);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent activities');
    }
  }
);

const activitiesSlice = createSlice({
  name: 'activities',
  initialState: {
    recentActivities: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentActivities.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.recentActivities = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default activitiesSlice.reducer;
