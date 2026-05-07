import api from './api';
import { getDeviceId } from '../utils/deviceId';

// Token and user are stored in sessionStorage so they clear on tab close.
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const register = async (data) => {
  const res = await api.post('/auth/register', { ...data, deviceId: getDeviceId() });
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password, deviceId: getDeviceId() });
  if (res.data.success) {
    sessionStorage.setItem(TOKEN_KEY, res.data.data.token);

    try {
      const meRes = await api.get('/auth/me');
      sessionStorage.setItem(USER_KEY, JSON.stringify(meRes.data.data));
    } catch {
      sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.data.user));
    }
  }
  return res.data;
};

export const logout = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
  return res.data.data;
};
