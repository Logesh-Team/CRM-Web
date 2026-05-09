import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import leadsReducer from '../features/leads/leadsSlice';
import activitiesReducer from '../features/activities/activitiesSlice';
import aiSearchReducer from '../features/ai-search/aiSearchSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadsReducer,
    activities: activitiesReducer,
    aiSearch: aiSearchReducer,
  },
});

export default store;
