import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { USERS } from '../../api/endpoints';
import toast from 'react-hot-toast';

const unwrap = (response) => response.data.data;

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (params = {}, { rejectWithValue }) => {
  try { return unwrap(await axiosInstance.get(USERS.LIST, { params })); }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch users'); }
});

export const fetchUserById = createAsyncThunk('users/fetchUserById', async (id, { rejectWithValue }) => {
  try { return unwrap(await axiosInstance.get(USERS.GET_BY_ID(id))); }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch user'); }
});

export const fetchMe = createAsyncThunk('users/fetchMe', async (_, { rejectWithValue }) => {
  try { return unwrap(await axiosInstance.get(USERS.ME)); }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch profile'); }
});

export const createUser = createAsyncThunk('users/createUser', async (data, { rejectWithValue }) => {
  try {
    const result = unwrap(await axiosInstance.post(USERS.CREATE, data));
    toast.success('User created successfully');
    return result;
  } catch (e) {
    const msg = e.response?.status === 409 ? 'Email already exists' : (e.response?.data?.message || 'Failed to create user');
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const updateUser = createAsyncThunk('users/updateUser', async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = unwrap(await axiosInstance.put(USERS.UPDATE(id), data));
    toast.success('Profile updated');
    return result;
  } catch (e) {
    const msg = e.response?.data?.message || 'Failed to update user';
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const changeUserRole = createAsyncThunk('users/changeUserRole', async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = unwrap(await axiosInstance.patch(USERS.CHANGE_ROLE(id), data));
    toast.success(`Role updated to ${data.role}`);
    return result;
  } catch (e) {
    const msg = e.response?.status === 403 ? "You don't have permission to do this" : (e.response?.data?.message || 'Failed to change role');
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const toggleUserActive = createAsyncThunk('users/toggleUserActive', async ({ id, name, activate }, { rejectWithValue }) => {
  try {
    const result = unwrap(await axiosInstance.patch(USERS.TOGGLE_ACTIVE(id)));
    toast.success(activate ? `${name} is now active` : `${name} has been deactivated`);
    return result;
  } catch (e) {
    const msg = e.response?.data?.message || 'Failed to update status';
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const deleteUser = createAsyncThunk('users/deleteUser', async ({ id }, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(USERS.DELETE(id));
    toast.success('User deleted');
    return id;
  } catch (e) {
    const msg = e.response?.status === 403 ? "You don't have permission to do this" : (e.response?.data?.message || 'Failed to delete user');
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const changePassword = createAsyncThunk('users/changePassword', async (data, { rejectWithValue }) => {
  try {
    await axiosInstance.post(USERS.CHANGE_PASSWORD, data);
    toast.success('Password changed successfully');
    return true;
  } catch (e) {
    const msg = e.response?.status === 400 ? 'Current password is incorrect' : (e.response?.data?.message || 'Failed to change password');
    return rejectWithValue(msg);
  }
});

export const fetchAuditLogs = createAsyncThunk('users/fetchAuditLogs', async (params = {}, { rejectWithValue }) => {
  try { return unwrap(await axiosInstance.get(USERS.AUDIT_LOGS, { params })); }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch audit logs'); }
});

export const fetchAuditByUser = createAsyncThunk('users/fetchAuditByUser', async (id, { rejectWithValue }) => {
  try { return unwrap(await axiosInstance.get(USERS.AUDIT_BY_USER(id))); }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch audit logs'); }
});

export const fetchSalesTeam = createAsyncThunk('users/fetchSalesTeam', async (_, { rejectWithValue }) => {
  try { return unwrap(await axiosInstance.get(USERS.SALES_TEAM)); }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch sales team'); }
});

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.content) return payload.content;
  return [];
};

const extractPagination = (payload, current) => {
  if (!payload) return current;
  if (payload.totalElements !== undefined) {
    return {
      page: payload.number ?? 0,
      size: payload.size ?? 10,
      totalElements: payload.totalElements,
      totalPages: payload.totalPages ?? 0,
    };
  }
  return current;
};

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    selectedUser: null,
    meUser: null,
    loading: false,
    error: null,
    pagination: { page: 0, size: 10, totalElements: 0, totalPages: 0 },
    filters: { role: '', isActive: '', keyword: '' },
    auditLogs: [],
    auditLoading: false,
    auditPagination: { page: 0, size: 20, totalElements: 0, totalPages: 0 },
    salesTeam: [],
    actionLoading: false,
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 0;
    },
    resetFilters(state) {
      state.filters = { role: '', isActive: '', keyword: '' };
      state.pagination.page = 0;
    },
    setPagination(state, action) {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearSelectedUser(state) {
      state.selectedUser = null;
    },
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.loading = false;
        s.users = extractList(a.payload);
        s.pagination = extractPagination(a.payload, s.pagination);
      })
      .addCase(fetchUsers.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchUserById.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUserById.fulfilled, (s, a) => { s.loading = false; s.selectedUser = a.payload; })
      .addCase(fetchUserById.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchMe.fulfilled, (s, a) => { s.meUser = a.payload; })

      .addCase(createUser.fulfilled, (s, a) => { if (a.payload) s.users.unshift(a.payload); })

      .addCase(updateUser.fulfilled, (s, a) => {
        const idx = s.users.findIndex((u) => u.id === a.payload?.id);
        if (idx !== -1) s.users[idx] = a.payload;
        if (s.selectedUser?.id === a.payload?.id) s.selectedUser = a.payload;
      })

      .addCase(changeUserRole.pending, (s) => { s.actionLoading = true; })
      .addCase(changeUserRole.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.users.findIndex((u) => u.id === a.payload?.id);
        if (idx !== -1) s.users[idx] = a.payload;
        if (s.selectedUser?.id === a.payload?.id) s.selectedUser = a.payload;
      })
      .addCase(changeUserRole.rejected, (s) => { s.actionLoading = false; })

      .addCase(toggleUserActive.pending, (s) => { s.actionLoading = true; })
      .addCase(toggleUserActive.fulfilled, (s, a) => {
        s.actionLoading = false;
        const idx = s.users.findIndex((u) => u.id === a.payload?.id);
        if (idx !== -1) s.users[idx] = a.payload;
        if (s.selectedUser?.id === a.payload?.id) s.selectedUser = a.payload;
      })
      .addCase(toggleUserActive.rejected, (s) => { s.actionLoading = false; })

      .addCase(deleteUser.pending, (s) => { s.actionLoading = true; })
      .addCase(deleteUser.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.users = s.users.filter((u) => u.id !== a.payload);
      })
      .addCase(deleteUser.rejected, (s) => { s.actionLoading = false; })

      .addCase(fetchAuditLogs.pending, (s) => { s.auditLoading = true; })
      .addCase(fetchAuditLogs.fulfilled, (s, a) => {
        s.auditLoading = false;
        s.auditLogs = extractList(a.payload);
        s.auditPagination = extractPagination(a.payload, s.auditPagination);
      })
      .addCase(fetchAuditLogs.rejected, (s) => { s.auditLoading = false; })

      .addCase(fetchAuditByUser.fulfilled, (s, a) => { s.auditLogs = extractList(a.payload); })

      .addCase(fetchSalesTeam.fulfilled, (s, a) => { s.salesTeam = extractList(a.payload); });
  },
});

export const { setFilters, resetFilters, setPagination, clearSelectedUser, clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
