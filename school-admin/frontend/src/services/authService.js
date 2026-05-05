import api from './api';

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  if (res.data.success) {
    localStorage.setItem('adminToken', res.data.data.token);
    localStorage.setItem('adminUser', JSON.stringify(res.data.data.user));
  }
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/login';
};

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('adminUser')); } catch { return null; }
};

export const isAuthenticated = () => !!localStorage.getItem('adminToken');
