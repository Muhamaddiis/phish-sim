import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token from localStorage (fallback)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/api/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  register: async (username: string, password: string, role: string = 'viewer') => {
    const response = await api.post('/api/register', { username, password, role });
    return response.data;
  },
};

// Campaign API
export const campaignAPI = {
  list: async () => {
    const response = await api.get('/api/campaigns');
    return response.data;
  },
  
  create: async (data: {
    name: string;
    email_subject: string;
    email_body: string;
    from_address: string;
  }) => {
    const response = await api.post('/api/campaigns', data);
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/api/campaigns/${id}`);
    return response.data;
  },
  
  uploadTargets: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/campaigns/${id}/upload-targets`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  send: async (id: string) => {
    const response = await api.post(`/api/campaigns/${id}/send`);
    return response.data;
  },
  
  getStats: async (id: string, groupBy: string = 'department') => {
    const response = await api.get(`/api/campaigns/${id}/stats?group_by=${groupBy}`);
    return response.data;
  },
  
  export: async (id: string) => {
    const response = await api.get(`/api/campaigns/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Stats API
export const statsAPI = {
  getOverall: async (groupBy: string = 'department') => {
    const response = await api.get(`/api/stats?group_by=${groupBy}`);
    return response.data;
  },
};

export default api;