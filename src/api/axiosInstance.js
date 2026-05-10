import axios from 'axios';

const STORAGE_KEYS = ['craviq_token', 'craviq_refresh_token', 'craviq_user'];

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('craviq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const DEV_BYPASS_TOKEN = 'dummy-bypass-token-craviq-dev';

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('craviq_token');
      // Don't log out during dev bypass mode — real 401 handling kicks in with a real token
      if (token !== DEV_BYPASS_TOKEN) {
        STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
