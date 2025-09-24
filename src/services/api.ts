// src/services/api.ts
import axios from 'axios';
import {
  User,
  WorkoutSession,
  Exercise,
  Goal,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  CreateWorkoutRequest,
  WorkoutStats,
  ExportData
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor för JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor för 401-fel
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
};

// Workouts API
export const workoutsAPI = {
  getAll: async (): Promise<WorkoutSession[]> => {
    const response = await api.get('/workouts');
    return response.data;
  },

  getById: async (id: number): Promise<WorkoutSession> => {
    const response = await api.get(`/workouts/${id}`);
    return response.data;
  },

  create: async (workout: CreateWorkoutRequest): Promise<WorkoutSession> => {
    const response = await api.post('/workouts', workout);
    return response.data;
  },

  update: async (id: number, workout: Partial<CreateWorkoutRequest>): Promise<WorkoutSession> => {
    const response = await api.put(`/workouts/${id}`, workout);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/workouts/${id}`);
  },

  getStats: async (): Promise<WorkoutStats> => {
    const response = await api.get('/workouts/stats');
    return response.data;
  },

  search: async (query: string): Promise<WorkoutSession[]> => {
    const response = await api.get(`/workouts/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

// Exercises API
export const exercisesAPI = {
  getAll: async (): Promise<Exercise[]> => {
    const response = await api.get('/exercises');
    return response.data;
  },

  getById: async (id: number): Promise<Exercise> => {
    const response = await api.get(`/exercises/${id}`);
    return response.data;
  },

  create: async (exercise: Omit<Exercise, 'id' | 'createdBy'>): Promise<Exercise> => {
    const response = await api.post('/exercises', exercise);
    return response.data;
  },

  update: async (id: number, exercise: Partial<Exercise>): Promise<Exercise> => {
    const response = await api.put(`/exercises/${id}`, exercise);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/exercises/${id}`);
  },

  search: async (query: string, category?: string): Promise<Exercise[]> => {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    const response = await api.get(`/exercises/search?${params.toString()}`);
    return response.data;
  }
};

// Goals API
export const goalsAPI = {
  getAll: async (): Promise<Goal[]> => {
    const response = await api.get('/goals');
    return response.data;
  },

  getById: async (id: number): Promise<Goal> => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  create: async (goal: Omit<Goal, 'id' | 'userId' | 'currentValue' | 'isCompleted' | 'createdAt'>): Promise<Goal> => {
    const response = await api.post('/goals', goal);
    return response.data;
  },

  update: async (id: number, goal: Partial<Goal>): Promise<Goal> => {
    const response = await api.put(`/goals/${id}`, goal);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },

  updateProgress: async (id: number, progress: number): Promise<Goal> => {
    const response = await api.patch(`/goals/${id}/progress`, { currentValue: progress });
    return response.data;
  }
};

// Export API
export const exportAPI = {
  exportToCSV: async (): Promise<string> => {
    const response = await api.get('/export/csv', { responseType: 'text' });
    return response.data;
  },

  exportToJSON: async (): Promise<ExportData> => {
    const response = await api.get('/export/json');
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  updateUserRole: async (id: number, role: 'user' | 'admin'): Promise<User> => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  }
};