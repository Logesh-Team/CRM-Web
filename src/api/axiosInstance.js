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
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3VVFJeDM2Yndzay0tUkdrYW1OWW5YMUpjLU1vZGRPS2NWVzBmS0k0Y19VIn0.eyJleHAiOjE3Nzg1MTk3MjQsImlhdCI6MTc3ODQ4MzcyNCwianRpIjoiMDdiMjYwMTEtNmMwNS00ZGE0LTk1ZmYtYzZhYmIxYzUzMThkIiwiaXNzIjoiaHR0cHM6Ly91c2VyLmV2eW9vZy5jb20vcmVhbG1zL2VWeW9vZyIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYnJva2VyIiwiYWNjb3VudCJdLCJzdWIiOiJkMmRhMmNhMi0zYzNmLTQ1N2UtYTIwMC01ZTk3MzQ0YmU3NzYiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJlVnlvb2ciLCJzaWQiOiI4ZjNiNDI4Yi0yMDY4LTQ2Y2ItYTU4OS1iMzc4MTNjMDM1ZWUiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8qIiwiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiQURNSU4iLCJVU0VSIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiZVZ5b29nIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIiwiVllHLUFETUlOIiwiVVNFUiJdfSwicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LXJlYWxtIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsImNyZWF0ZS1jbGllbnQiLCJtYW5hZ2UtdXNlcnMiLCJxdWVyeS1yZWFsbXMiLCJ2aWV3LWF1dGhvcml6YXRpb24iLCJxdWVyeS1jbGllbnRzIiwicXVlcnktdXNlcnMiLCJtYW5hZ2UtZXZlbnRzIiwibWFuYWdlLXJlYWxtIiwidmlldy1ldmVudHMiLCJWWUctQURNSU4iLCJ2aWV3LXVzZXJzIiwidmlldy1jbGllbnRzIiwibWFuYWdlLWF1dGhvcml6YXRpb24iLCJtYW5hZ2UtY2xpZW50cyIsInF1ZXJ5LWdyb3VwcyJdfSwiYnJva2VyIjp7InJvbGVzIjpbInJlYWQtdG9rZW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJ2aWV3LWFwcGxpY2F0aW9ucyIsInZpZXctY29uc2VudCIsInZpZXctZ3JvdXBzIiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJtYW5hZ2UtY29uc2VudCIsImRlbGV0ZS1hY2NvdW50Iiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJTYW5kYm94IHMiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzYW5kYm94YWRtaW4iLCJnaXZlbl9uYW1lIjoiU2FuZGJveCIsImZhbWlseV9uYW1lIjoicyIsInRlbmFudCI6InRpY2tldF9zYW5kYm94IiwiZW1haWwiOiJhZG1pbkB2eW9vZy5jb20ifQ.cXC0HghvxsTB2ui09clahvM6Y5PtGOIpypmhAMBK6UDWPON7pTEMuzY9DrNVPy0IOMpNySH8NoRHEYCU1GwHgZ_RxJba-DoEOzY-QTFYn0FEPKH94n09MvaVNdr2CSOnR6sYbwA6lwyDwutmSlOFe9903Cqtl5jQT0ZhUMzoSysg-sio9KPVBAqvAjml6ajDhxYdBDA0WdHtKMaL2e_TKNp4YgVKU009vBPYybyrMP2-2RtgoO3j-UxPS7UP-Q2cbtYdl-p8oZQgBvEnNjZj8PStA9ewMTc56C8PTpAxQkZ4L-_j4qKLYrze7xfRH3-Pp-D5R7sKLs6kxsFqGMW1UA";
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
