import axios from "axios";

const STORAGE_KEYS = ["craviq_token", "craviq_refresh_token", "craviq_user"];

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-TENANT-ID": "ticket_sandbox",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3VVFJeDM2Yndzay0tUkdrYW1OWW5YMUpjLU1vZGRPS2NWVzBmS0k0Y19VIn0.eyJleHAiOjE3Nzg0MzcxNTMsImlhdCI6MTc3ODQwMTE1MywianRpIjoiMTliNzFiMzQtM2Y3MS00MWViLWEzMzQtYzY5NjYwMzdjMTg1IiwiaXNzIjoiaHR0cHM6Ly91c2VyLmV2eW9vZy5jb20vcmVhbG1zL2VWeW9vZyIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYnJva2VyIiwiYWNjb3VudCJdLCJzdWIiOiJkMmRhMmNhMi0zYzNmLTQ1N2UtYTIwMC01ZTk3MzQ0YmU3NzYiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJlVnlvb2ciLCJzaWQiOiI4MGM4NGVlMC0xMGRkLTQwYmItYjk4Mi05NDJkZGI1MDIxMTIiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8qIiwiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiQURNSU4iLCJVU0VSIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiZVZ5b29nIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIiwiVllHLUFETUlOIiwiVVNFUiJdfSwicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LXJlYWxtIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsImNyZWF0ZS1jbGllbnQiLCJtYW5hZ2UtdXNlcnMiLCJxdWVyeS1yZWFsbXMiLCJ2aWV3LWF1dGhvcml6YXRpb24iLCJxdWVyeS1jbGllbnRzIiwicXVlcnktdXNlcnMiLCJtYW5hZ2UtZXZlbnRzIiwibWFuYWdlLXJlYWxtIiwidmlldy1ldmVudHMiLCJWWUctQURNSU4iLCJ2aWV3LXVzZXJzIiwidmlldy1jbGllbnRzIiwibWFuYWdlLWF1dGhvcml6YXRpb24iLCJtYW5hZ2UtY2xpZW50cyIsInF1ZXJ5LWdyb3VwcyJdfSwiYnJva2VyIjp7InJvbGVzIjpbInJlYWQtdG9rZW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJ2aWV3LWFwcGxpY2F0aW9ucyIsInZpZXctY29uc2VudCIsInZpZXctZ3JvdXBzIiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJtYW5hZ2UtY29uc2VudCIsImRlbGV0ZS1hY2NvdW50Iiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJTYW5kYm94IHMiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzYW5kYm94YWRtaW4iLCJnaXZlbl9uYW1lIjoiU2FuZGJveCIsImZhbWlseV9uYW1lIjoicyIsInRlbmFudCI6InRpY2tldF9zYW5kYm94IiwiZW1haWwiOiJhZG1pbkB2eW9vZy5jb20ifQ.ddcfnX__TDhByWjp9OcLMrtuYwYEd-y1Kt0XlBRsGzJupQCMV29SEfrPy_U_ulnxNTSamRqKw7jTax1bvFjojo-WgyAr82bX295M1SKNTtzwzHW7z59ArpI148qj7QcWfHU9AmsE1ta1onK6OeB2gB_C-Vd5rlAghrdTiDVLzjT9qyG7_dUmlmo1jrJqaUi5oUFmIEHLCkUlLpY8jLRK__5zeZCUtHf63I-Wehvu8UPcIMVj37RUthMuycMHOOAWQKFZ3Bu2iXJR4d5EfLxObLM_D_FBkSfJG2M723ad0_tPzldcTyt-Dz7WXB7DoaInAVvc0zlKwyEOQ4t0nzS26Q";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const DEV_BYPASS_TOKEN = "dummy-bypass-token-craviq-dev";

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("craviq_token");
      // Don't log out during dev bypass mode — real 401 handling kicks in with a real token
      if (token !== DEV_BYPASS_TOKEN) {
        STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
