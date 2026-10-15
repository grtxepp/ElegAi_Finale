import axios from 'axios';
import { API_BASE } from './config';

/**
 * Shared axios client for the mobile app. The browser-only web frontend uses
 * its own client; this one talks to the same Express API in absolute URLs.
 * The token lives in memory here and is persisted by AuthContext.
 */
let TOKEN = null;
export const setToken = (t) => {
  TOKEN = t;
};
export const getToken = () => TOKEN;

const api = axios.create({ baseURL: API_BASE, timeout: 30000 });

api.interceptors.request.use((cfg) => {
  if (TOKEN) cfg.headers.Authorization = `Bearer ${TOKEN}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) setToken(null);
    return Promise.reject(error);
  }
);

/** Human-readable message from an axios error. */
export const errMsg = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
