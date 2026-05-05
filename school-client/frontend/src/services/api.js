import axios from 'axios';
import { getDeviceId } from '../utils/deviceId';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach JWT and device ID to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Device-ID'] = getDeviceId();
  return config;
});

// Handle 401 globally — clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
