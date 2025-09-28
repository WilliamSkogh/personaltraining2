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

// FIXAD: Använd relativ URL så proxyn fungerar
const API_BASE_URL = '/api';

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

// Response interceptor för automatisk logout vid 401-fel
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Rensa lokal auth-data
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      // Försök anropa logout endpoint för att rensa session
      try {
        await fetch('/api/login', { method: 'DELETE' });
      } catch (logoutError) {
        console.warn('Auto-logout backend call failed:', logoutError);
      }
      
      // Redirecta till login (bara om vi inte redan är där)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API - Anpassad för din .NET backend
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await api.post('/login', {
      email: credentials.username, // Backend förväntar email
      password: credentials.password
    });
    return response.data;
  },

  register: async (userData: RegisterData): Promise<User> => {
    const response = await api.post('/users', {
      Username: userData.username,
      Email: userData.email,
      password: userData.password
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/login');
    return response.data;
  },

  logout: async () => {
    await api.delete('/login');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
};

// Workouts API - Dessa endpoints behöver skapas i backend senare
export const workoutsAPI = {
  getAll: async (): Promise<WorkoutSession[]> => {
    // Tillfälligt: returnera tom array tills endpoints finns
    return [];
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
    // Tillfälligt: returnera mock-data
    return {
      totalWorkouts: 0,
      totalDuration: 0,
      favoriteExercise: '',
      weeklyProgress: []
    };
  },

  search: async (query: string): Promise<WorkoutSession[]> => {
    const response = await api.get(`/workouts/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

// Exercises API - Används generiska REST endpoints
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

// Goals API - Används generiska REST endpoints
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

// Export API - Framtida funktionalitet
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

// Admin API - Använder users endpoints
export const adminAPI = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  updateUserRole: async (id: number, role: 'user' | 'admin'): Promise<User> => {
    const response = await api.put(`/users/${id}`, { Role: role });
    return response.data;
  },

  getSystemStats: async () => {
    // Tillfällig mock-data
    return {
      totalUsers: 0,
      totalWorkouts: 0,
      activeUsers: 0
    };
  }
};