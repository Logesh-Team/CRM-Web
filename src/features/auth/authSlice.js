import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const DUMMY_TOKEN = "dummy-bypass-token-craviq-dev";

// TODO: Replace with real Keycloak auth when ready
export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ username }) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const profile = {
      id: "usr-001",
      name: username,
      preferred_username: username,
      role: "SUPER_ADMIN",
    };

    localStorage.setItem("craviq_token", DUMMY_TOKEN);
    localStorage.setItem("craviq_user", JSON.stringify(profile));

    return { access_token: DUMMY_TOKEN, user: profile };
  }
);

// ─── RESTORE USER FROM STORAGE ───────────────────────────────────────
const storedUser = () => {
  try {
    const u = localStorage.getItem("craviq_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

// ─── SLICE ───────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser(),
    token: localStorage.getItem("craviq_token") || null,
    isAuthenticated: !!localStorage.getItem("craviq_token"),
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      localStorage.removeItem("craviq_token");
      localStorage.removeItem("craviq_refresh_token");
      localStorage.removeItem("craviq_user");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
