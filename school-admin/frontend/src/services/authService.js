import api from './api';

const TOKEN_KEY = 'adminToken';
const USER_KEY = 'adminUser';

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  if (res.data.success) {
    sessionStorage.setItem(TOKEN_KEY, res.data.data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.data.user));
  }
  return res.data;
};

export const logout = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};

export const getStoredUser = () => {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; }
};

export const isAuthenticated = () => !!sessionStorage.getItem(TOKEN_KEY);
