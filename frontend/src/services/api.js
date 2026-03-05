import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor: auto-refresh token ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  getMe: () => api.get('/auth/me/'),
  updateMe: (data) => api.patch('/auth/me/update/', data),
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStudentDashboard: () => api.get('/dashboard/student/'),
  getLibrarianDashboard: () => api.get('/dashboard/librarian/'),
};

// ─── Books ─────────────────────────────────────────────────────────────────────
export const booksAPI = {
  getAll: (params) => api.get('/books/', { params }),
  getBySlug: (slug) => api.get(`/books/${slug}/`),
  create: (data) => api.post('/books/', data),
  update: (slug, data) => api.put(`/books/${slug}/`, data),
  patch: (slug, data) => api.patch(`/books/${slug}/`, data),
  delete: (slug) => api.delete(`/books/${slug}/`),
  updateCopies: (slug, data) => api.post(`/books/${slug}/update_copies/`, data),
};

// ─── Categories, Authors, Publishers ──────────────────────────────────────────
export const categoriesAPI = {
  getAll: (params) => api.get('/categories/', { params }),
  create: (data) => api.post('/categories/', data),
  update: (slug, data) => api.put(`/categories/${slug}/`, data),
  delete: (slug) => api.delete(`/categories/${slug}/`),
};

export const authorsAPI = {
  getAll: (params) => api.get('/authors/', { params }),
  create: (data) => api.post('/authors/', data),
  update: (slug, data) => api.put(`/authors/${slug}/`, data),
  delete: (slug) => api.delete(`/authors/${slug}/`),
};

export const publishersAPI = {
  getAll: (params) => api.get('/publishers/', { params }),
  create: (data) => api.post('/publishers/', data),
};

// ─── Borrowings ────────────────────────────────────────────────────────────────
export const borrowingsAPI = {
  getAll: (params) => api.get('/borrowings/', { params }),
  issueBook: (data) => api.post('/borrowings/issue/', data),
  returnBook: (data) => api.post('/borrowings/return/', data),
  getOverdue: () => api.get('/borrowings/overdue/'),
  getMyHistory: (params) => api.get('/borrowings/my-history/', { params }),
};

// ─── Fines ─────────────────────────────────────────────────────────────────────
export const finesAPI = {
  getAll: (params) => api.get('/fines/', { params }),
  getBySlug: (slug) => api.get(`/fines/${slug}/`),
  waive: (slug, data) => api.post(`/fines/${slug}/waive/`, data),
  initiatePayment: (slug, data) => api.post(`/fines/${slug}/initiate-payment/`, data),
  confirmPayment: (slug, data) => api.post(`/fines/${slug}/confirm-payment/`, data),
};

// ─── Reservations ──────────────────────────────────────────────────────────────
export const reservationsAPI = {
  getAll: (params) => api.get('/reservations/', { params }),
  create: (data) => api.post('/reservations/', data),
  cancel: (slug) => api.post(`/reservations/${slug}/cancel/`),
};

// ─── Announcements ─────────────────────────────────────────────────────────────
export const announcementsAPI = {
  getAll: () => api.get('/announcements/'),
  create: (data) => api.post('/announcements/', data),
  update: (slug, data) => api.patch(`/announcements/${slug}/`, data),
  delete: (slug) => api.delete(`/announcements/${slug}/`),
};

// ─── Students (Librarian view) ─────────────────────────────────────────────────
export const studentsAPI = {
  getAll: (params) => api.get('/students/', { params }),
  getBySlug: (slug) => api.get(`/students/${slug}/`),
  getBorrowingHistory: (slug) => api.get(`/students/${slug}/borrowing-history/`),
  getFines: (slug) => api.get(`/students/${slug}/fines/`),
  toggleActive: (slug) => api.post(`/students/${slug}/toggle-active/`),
};

// ─── Transactions ──────────────────────────────────────────────────────────────
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions/', { params }),
};

export default api;