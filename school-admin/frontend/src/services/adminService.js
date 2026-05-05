import api from './api';

// Dashboard
export const getDashboardStats = async () => {
  const res = await api.get('/dashboard');
  return res.data.data;
};

// Devices
export const getPendingDevices = async () => {
  const res = await api.get('/devices/pending');
  return res.data.data;
};

export const verifyDevice = async (userId, deviceId) => {
  const res = await api.patch(`/devices/${userId}/${deviceId}/verify`);
  return res.data;
};

export const revokeDevice = async (userId, deviceId) => {
  const res = await api.patch(`/devices/${userId}/${deviceId}/revoke`);
  return res.data;
};

// Students
export const getStudents = async (params = {}) => {
  const res = await api.get('/students', { params });
  return res.data.data;
};

export const getStudent = async (id) => {
  const res = await api.get(`/students/${id}`);
  return res.data.data;
};

export const createStudent = async (data) => {
  const res = await api.post('/students', data);
  return res.data.data;
};

export const updateStudent = async (id, data) => {
  const res = await api.put(`/students/${id}`, data);
  return res.data.data;
};

export const updateGrades = async (id, grades) => {
  const res = await api.put(`/students/${id}/grades`, { grades });
  return res.data.data;
};

export const markAttendance = async (id, records) => {
  const res = await api.put(`/students/${id}/attendance`, { records });
  return res.data.data;
};

export const linkUserAccount = async (studentId, email) => {
  const res = await api.patch(`/students/${studentId}/link-account`, { email });
  return res.data;
};

export const getUnlinkedUsers = async () => {
  const res = await api.get('/students/unlinked-users');
  return res.data.data;
};

// Classes
export const getClasses = async () => {
  const res = await api.get('/classes');
  return res.data.data;
};

export const getTeachers = async () => {
  const res = await api.get('/classes/teachers');
  return res.data.data;
};

export const createClass = async (data) => {
  const res = await api.post('/classes', data);
  return res.data.data;
};

export const updateClass = async (id, data) => {
  const res = await api.put(`/classes/${id}`, data);
  return res.data.data;
};

export const assignTeacher = async (classId, teacherId, subject) => {
  const res = await api.patch(`/classes/${classId}/assign-teacher`, { teacherId, subject });
  return res.data.data;
};

export const removeTeacher = async (classId, subject) => {
  const res = await api.patch(`/classes/${classId}/remove-teacher`, { subject });
  return res.data.data;
};

export const updateTimetable = async (classId, timetable) => {
  const res = await api.put(`/classes/${classId}/timetable`, { timetable });
  return res.data.data;
};

// Fees
export const getTransactions = async (params = {}) => {
  const res = await api.get('/fees', { params });
  return res.data.data;
};

export const getFeeStats = async () => {
  const res = await api.get('/fees/stats');
  return res.data.data;
};

export const processWithdrawal = async (txId, action) => {
  const res = await api.patch(`/fees/${txId}/process`, { action });
  return res.data;
};

// Staff
export const createStaff = async (data) => {
  const res = await api.post('/auth/staff', data);
  return res.data.data;
};
