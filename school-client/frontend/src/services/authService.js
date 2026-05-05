import api from './api';
import { getDeviceId } from '../utils/deviceId';

export const register = async (data) => {
  const res = await api.post('/auth/register', { ...data, deviceId: getDeviceId() });
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password, deviceId: getDeviceId() });
  if (res.data.success) {
    // Store token first so the /me call can authenticate
    localStorage.setItem('token', res.data.data.token);

    // Fetch the full user profile (includes studentProfile, children, etc.)
    try {
      const meRes = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(meRes.data.data));
    } catch {
      // Fallback to login response if /me fails
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
    }
  }
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  // Always keep localStorage in sync
  localStorage.setItem('user', JSON.stringify(res.data.data));
  return res.data.data;
};
