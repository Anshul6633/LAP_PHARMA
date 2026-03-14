import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharma_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pharma_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Service helpers ──────────────────────────────────────────────────────────
export const authService    = { login: (d) => api.post('/auth/login', d), me: () => api.get('/auth/me'), changePassword: (d) => api.put('/auth/password', d) };
export const userService    = { getAll: (p) => api.get('/users', { params: p }), getById: (id) => api.get(`/users/${id}`), update: (id, d) => api.put(`/users/${id}`, d), remove: (id) => api.delete(`/users/${id}`), stats: () => api.get('/users/stats/summary'), register: (d) => api.post('/auth/register', d) };
export const semesterService= { getAll: () => api.get('/semesters'), getById: (id) => api.get(`/semesters/${id}`), create: (d) => api.post('/semesters', d), update: (id, d) => api.put(`/semesters/${id}`, d), remove: (id) => api.delete(`/semesters/${id}`) };
export const subjectService = { getAll: (p) => api.get('/subjects', { params: p }), getById: (id) => api.get(`/subjects/${id}`), create: (d) => api.post('/subjects', d), update: (id, d) => api.put(`/subjects/${id}`, d), remove: (id) => api.delete(`/subjects/${id}`) };
export const labService     = { getAll: (p) => api.get('/labs', { params: p }), getById: (id) => api.get(`/labs/${id}`), create: (d) => api.post('/labs', d), update: (id, d) => api.put(`/labs/${id}`, d), remove: (id) => api.delete(`/labs/${id}`), uploadManual: (id, f) => api.post(`/labs/${id}/manual`, f, { headers: { 'Content-Type': 'multipart/form-data' } }) };
export const experimentService = { getAll: (p) => api.get('/experiments', { params: p }), getById: (id) => api.get(`/experiments/${id}`), create: (d) => api.post('/experiments', d), update: (id, d) => api.put(`/experiments/${id}`, d), approve: (id) => api.put(`/experiments/${id}/approve`), remove: (id) => api.delete(`/experiments/${id}`), upload: (id, f, t) => api.post(`/experiments/${id}/upload`, f, { headers: { 'Content-Type': 'multipart/form-data' } }) };
export const solutionService   = { getAll: (p) => api.get('/solutions', { params: p }), getById: (id) => api.get(`/solutions/${id}`), create: (d) => api.post('/solutions', d), update: (id, d) => api.put(`/solutions/${id}`, d), remove: (id) => api.delete(`/solutions/${id}`), updateStock: (id, d) => api.patch(`/solutions/${id}/stock`, d) };
export const equipmentService  = { getAll: (p) => api.get('/equipment', { params: p }), getById: (id) => api.get(`/equipment/${id}`), create: (d) => api.post('/equipment', d), update: (id, d) => api.put(`/equipment/${id}`, d), remove: (id) => api.delete(`/equipment/${id}`), lowStock: () => api.get('/equipment/low-stock'), addMaintenance: (id, d) => api.post(`/equipment/${id}/maintenance`, d), updateAvailability: (id, d) => api.patch(`/equipment/${id}/availability`, d) };
export const attendanceService = { getAll: (p) => api.get('/attendance', { params: p }), studentSummary: (id) => api.get(`/attendance/student/${id}`), create: (d) => api.post('/attendance', d), update: (id, d) => api.put(`/attendance/${id}`, d) };
export const recordService     = { getAll: (p) => api.get('/records', { params: p }), getById: (id) => api.get(`/records/${id}`), create: (d) => api.post('/records', d), update: (id, d) => api.put(`/records/${id}`, d), evaluate: (id, d) => api.put(`/records/${id}/evaluate`, d) };
export const reportService     = {
  analytics: () => api.get('/reports/analytics'),
  studentPdf: (id) => api.get(`/reports/student/${id}/pdf`, { responseType: 'blob' }),
  semesterReport: (id) => api.get(`/reports/semester/${id}`),
  inventoryExport: (format = 'pdf') => api.get(`/reports/inventory/export?format=${format}`, { responseType: 'blob' }),
};
export const notificationService = { getAll: () => api.get('/notifications'), create: (d) => api.post('/notifications', d), markRead: (id) => api.put(`/notifications/${id}/read`), markAllRead: () => api.put('/notifications/read-all'), remove: (id) => api.delete(`/notifications/${id}`) };
