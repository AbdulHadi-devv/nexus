import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ========================================
// AXIOS INSTANCE (for Knowledge Management)
// ========================================

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========================================
// AUTH ENDPOINTS
// ========================================

export const register = (email, password, name) => 
  api.post('/auth/register', { email, password, name });

export const login = (email, password) => 
  api.post('/auth/login', { email, password });

export const getCurrentUser = () => 
  api.get('/auth/me');

// ========================================
// KNOWLEDGE ITEMS ENDPOINTS
// ========================================

export const createItem = (data) => 
  api.post('/items', data);

export const getItems = () => 
  api.get('/items');

export const getItem = (id) => 
  api.get(`/items/${id}`);

export const updateItem = (id, data) => 
  api.put(`/items/${id}`, data);

export const deleteItem = (id) => 
  api.delete(`/items/${id}`);

// ========================================
// TAGS ENDPOINTS
// ========================================

export const createTag = (data) => 
  api.post('/tags', data);

export const getTags = () => 
  api.get('/tags');

export const deleteTag = (id) => 
  api.delete(`/tags/${id}`);

// ========================================
// CONNECTIONS ENDPOINTS
// ========================================

export const createConnection = (data) => 
  api.post('/connections', data);

export const deleteConnection = (id) => 
  api.delete(`/connections/${id}`);

export const getConnectionsByItem = (itemId) => 
  api.get(`/connections/item/${itemId}`);

// ========================================
// SEARCH ENDPOINT
// ========================================

export const search = (query) => 
  api.get(`/search?q=${encodeURIComponent(query)}`);

// ========================================
// AI ENDPOINTS (for AI Builder)
// ========================================

export const analyzeProblem = async (problem) => {
  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ problem })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message);
  }

  return data;
};

export const generateSolutions = async (problem, analysis) => {
  const response = await fetch(`${API_URL}/solutions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      problem,
      analysis
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message);
  }

  return data;
};

export const generateBlueprint = async (problem, analysis, solution) => {
  const response = await fetch(`${API_URL}/blueprint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      problem,
      analysis,
      solution
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message);
  }

  return data;
};

export default api;