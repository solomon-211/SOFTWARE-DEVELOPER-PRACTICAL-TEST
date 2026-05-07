import axios from 'axios';
import { getDeviceId } from '../utils/deviceId';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
});

// Attach JWT and device ID to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Device-ID'] = getDeviceId();
  return config;
});

// Handle 401 globally — clear session and redirect to login
// Attempt to refresh access token on 401 once, then retry original request
const refreshClient = async () => {
  try {
    const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
    const token = res.data.data.token;
    const user = res.data.data.user;
    if (token) {
      sessionStorage.setItem('token', token);
      if (user) sessionStorage.setItem('user', JSON.stringify(user));
      return token;
    }
    return null;
  } catch (e) { return null; }
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const newToken = await refreshClient();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      // Refresh failed — clear session and redirect
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
