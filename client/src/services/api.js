import axios from 'axios';

// ========================================
// API BASE URL
// ========================================
// Priority order:
//   1. VITE_API_URL      (Vite builds — Netlify will set this)
//   2. REACT_APP_API_URL (CRA builds — Netlify will set this)
//   3. Production fallback → Render backend
//   4. Dev fallback → localhost:5000
const RENDER_URL = 'https://nexus-backend-dae7.onrender.com';
const LOCAL_URL = 'http://localhost:5000';

const getBaseUrl = () => {
  // Vite
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // CRA
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Production fallback
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return RENDER_URL;
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return RENDER_URL;
  }
  // Dev fallback
  return LOCAL_URL;
};

const API_URL = `${getBaseUrl()}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// ========================================
// AUTH
// ========================================
export const register = (email, password, name) =>
  api.post('/auth/register', { email, password, name });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const getCurrentUser = () =>
  api.get('/auth/me');

// ========================================
// KNOWLEDGE ITEMS
// ========================================
export const createItem = (data) => api.post('/items', data);
export const getItems = () => api.get('/items');
export const getItem = (id) => api.get(`/items/${id}`);
export const updateItem = (id, data) => api.put(`/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/items/${id}`);

// ========================================
// TAGS
// ========================================
export const createTag = (data) => api.post('/tags', data);
export const getTags = () => api.get('/tags');
export const updateTag = (id, data) => api.put(`/tags/${id}`, data);
export const mergeTags = (sourceId, targetId) =>
  api.post(`/tags/${sourceId}/merge`, { targetTagId: targetId });
export const deleteTag = (id) => api.delete(`/tags/${id}`);

// ========================================
// CONNECTIONS
// ========================================
export const createConnection = (data) => api.post('/connections', data);
export const deleteConnection = (id) => api.delete(`/connections/${id}`);
export const getConnectionsByItem = (itemId) => api.get(`/connections/item/${itemId}`);

// ========================================
// SEARCH
// ========================================
export const search = (query) =>
  api.get(`/search?q=${encodeURIComponent(query)}`);

// ========================================
// AI SUGGESTIONS
// ========================================
export const suggestConnections = (itemId) =>
  api.post('/suggest-connections', { itemId });

// ========================================
// AI BUILDER ENDPOINTS
// ========================================
export const analyzeProblem = async (problem) => {
  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message);
  return data;
};

export const generateSolutions = async (problem, analysis) => {
  const response = await fetch(`${API_URL}/solutions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, analysis }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message);
  return data;
};

export const generateBlueprint = async (problem, analysis, solution) => {
  const response = await fetch(`${API_URL}/blueprint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, analysis, solution }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message);
  return data;
};

export default api;