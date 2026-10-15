import axios from 'axios';

/**
 * Shared axios instance. The browser only ever talks to the Express REST API
 * through relative /api routes (proxied by Vite in dev). The MySQL database
 * and AI API keys are never exposed to the frontend.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('elegai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('elegai_token');
      localStorage.removeItem('elegai_token');
      localStorage.removeItem('elegai_user');
      if (hadToken) window.dispatchEvent(new Event('elegai:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/** Human-readable message from an axios error. */
export const errMsg = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
