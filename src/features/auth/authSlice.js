import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../../api/axiosInstance";
import { AUTH } from "../../api/endpoints";

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(AUTH.LOGIN, { email, password });
      // Backend wraps in ApiResponse: response.data.data holds the payload
      const payload = response.data?.data ?? response.data;
      const token = payload?.token ?? payload?.accessToken ?? payload;

      if (!token || typeof token !== "string") {
        return rejectWithValue("Unexpected response from server");
      }

      // Decode JWT claims to build the user profile
      let user;
      try {
        const decoded = jwtDecode(token);
        user = {
          id:                 decoded.sub || decoded.userId || decoded.id,
          name:               decoded.name || decoded.fullName || decoded.given_name || email.split("@")[0],
          email:              decoded.email || email,
          role:               decoded.role || (Array.isArray(decoded.roles) ? decoded.roles[0] : null),
          preferred_username: decoded.preferred_username || decoded.email || email,
        };
      } catch {
        // JWT decode failed — use whatever the server returned alongside the token
        user = payload?.user || {
          email,
          name: email.split("@")[0],
          preferred_username: email,
          role: "SALES_EXECUTIVE",
        };
      }

      localStorage.setItem("craviq_token", token);
      localStorage.setItem("craviq_user", JSON.stringify(user));

      return { access_token: token, user };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.response?.status === 401 ? "Invalid email or password" : "Login failed. Check the server is running.");
      return rejectWithValue(msg);
    }
  }
);

const storedUser = () => {
  try {
    const u = localStorage.getItem("craviq_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

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
