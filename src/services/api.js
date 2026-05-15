import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur : ajoute le token JWT à chaque requête
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : gère les erreurs 401 (token expiré)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
};

// ==================== USERS ====================
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  updateVehicle: (data) => api.put('/users/vehicle', data),
};

// ==================== TRIPS ====================
export const tripAPI = {
  search: (params) => api.get('/trips/search', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  publish: (data) => api.post('/trips', data),
  getMyTrips: () => api.get('/trips/my-trips'),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
};

// ==================== BOOKINGS ====================
export const bookingAPI = {
  create: (tripId, seats) => api.post('/bookings', { tripId, seats }),
  getMyBookings: () => api.get('/bookings/my'),
  updateStatus: (id, status) => api.put(`/bookings/${id}`, { status }),
};

// ==================== REVIEWS ====================
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getByDriver: (driverId) => api.get(`/reviews/driver/${driverId}`),
};

// ==================== NOTIFICATIONS ====================
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ==================== ADMIN ====================
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getTrips: () => api.get('/admin/trips'),
  updateTripStatus: (id, status) => api.put(`/admin/trips/${id}/status`, { status }),
  deleteTrip: (id) => api.delete(`/admin/trips/${id}`),
  getBookings: () => api.get('/admin/bookings'),
};

export default api;
