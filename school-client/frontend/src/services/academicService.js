import api from './api';

// Academic data API calls for the client portal.
// All endpoints require a verified device (enforced by the backend middleware).
export const getStudentProfile = async (studentId) => {
  const res = await api.get(`/academic/${studentId}/profile`);
  return res.data.data;
};

export const getGrades = async (studentId) => {
  const res = await api.get(`/academic/${studentId}/grades`);
  return res.data.data;
};

export const getAttendance = async (studentId) => {
  const res = await api.get(`/academic/${studentId}/attendance`);
  return res.data.data;
};

export const getTimetable = async (studentId) => {
  const res = await api.get(`/academic/${studentId}/timetable`);
  return res.data.data;
};
