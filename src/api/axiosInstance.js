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
    const token = localStorage.getItem("craviq_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
