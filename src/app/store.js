import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import leadsReducer from '../features/leads/leadsSlice';
import activitiesReducer from '../features/activities/activitiesSlice';
import aiSearchReducer from '../features/ai-search/aiSearchSlice';
import usersReducer from '../features/users/usersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadsReducer,
    activities: activitiesReducer,
    aiSearch: aiSearchReducer,
    users: usersReducer,
  },
});

export default store;
