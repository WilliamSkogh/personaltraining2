import axios from 'axios';

// Helpers to map DB (PascalCase) → frontend types (camelCase) 
const toUser = (row: any) => ({
  id: row.Id,
  username: row.Username,
  email: row.Email,
  role: row.Role ?? 'user',
  createdAt: row.CreatedAt ?? null
});

const toWorkout = (row: any) => ({
  id: row.Id,
  userId: row.UserId,
  name: row.Name,
  date: row.Date,
  duration: row.Duration ?? null,
  notes: row.Notes ?? null,
  createdAt: row.CreatedAt ?? null
});

const toExercise = (row: any) => ({
  id: row.Id,
  name: row.Name,
  category: row.Category,
  description: row.Description ?? null,
  createdBy: row.CreatedBy ?? null,
  isPublic: !!row.IsPublic,
  createdAt: row.CreatedAt ?? null
});

const toGoal = (row: any) => ({
  id: row.Id,
  userId: row.UserId,
  title: row.Title,
  targetValue: Number(row.TargetValue),
  currentValue: Number(row.CurrentValue ?? 0),
  unit: row.Unit ?? '',
  targetDate: row.TargetDate ?? null,
  isCompleted: !!row.IsCompleted,
  createdAt: row.CreatedAt ?? null
});

//  Axios instance (cookies + same-origin) 
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// 401 → skicka användaren till /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth (session-cookie) 
export interface LoginCredentials { email: string; password: string; }
export interface RegisterData { email: string; username: string; password: string; }
export interface User {
  id: number; username: string; email: string; role: 'user' | 'admin'; createdAt?: string | null;
}
export interface AuthResponse { user: User; }

export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Backend mappas så att password → PasswordHash (servern hashar)
    const res = await api.post('/users', {
      email: data.email,
      username: data.username,
      password: data.password
    });
    return { user: toUser(res.data) };
  },

  login: async (cred: LoginCredentials): Promise<AuthResponse> => {
    const res = await api.post('/login', cred);
    return { user: toUser(res.data) };
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/login');
    if (res.data?.error) throw new Error(res.data.error);
    return toUser(res.data);
  },

  logout: async (): Promise<void> => {
    await api.delete('/login');
  }
};

// Workouts (WorkoutSessions) 
export interface WorkoutSession {
  id: number; userId: number; name: string; date: string;
  duration?: number | null; notes?: string | null; createdAt?: string | null;
}
export interface CreateWorkoutRequest {
  userId: number; name: string; date: string; duration?: number; notes?: string;
}
export interface WorkoutStats {
  totalWorkouts: number;
  totalMinutes: number;
  byMonth: Record<string, number>;
}

export const workoutsAPI = {
  getAll: async (): Promise<WorkoutSession[]> => {
    const r = await api.get('/WorkoutSessions');
    return (Array.isArray(r.data) ? r.data : [r.data]).map(toWorkout);
  },

  getById: async (id: number): Promise<WorkoutSession> => {
    const r = await api.get(`/WorkoutSessions/${id}`);
    return toWorkout(r.data);
  },

  create: async (workout: CreateWorkoutRequest): Promise<WorkoutSession> => {
    const r = await api.post('/WorkoutSessions', {
      UserId: workout.userId,
      Name: workout.name,
      Date: workout.date,
      Duration: workout.duration,
      Notes: workout.notes
    });
    return toWorkout(r.data);
  },

  update: async (id: number, workout: Partial<CreateWorkoutRequest>): Promise<WorkoutSession> => {
    const r = await api.put(`/WorkoutSessions/${id}`, {
      ...(workout.userId !== undefined ? { UserId: workout.userId } : {}),
      ...(workout.name   !== undefined ? { Name: workout.name } : {}),
      ...(workout.date   !== undefined ? { Date: workout.date } : {}),
      ...(workout.duration !== undefined ? { Duration: workout.duration } : {}),
      ...(workout.notes  !== undefined ? { Notes: workout.notes } : {})
    });
    return toWorkout(r.data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/WorkoutSessions/${id}`);
  },

  // Hämtar allt och summerar lokalt 
  getStats: async (): Promise<WorkoutStats> => {
    const list = await workoutsAPI.getAll();
    const totalWorkouts = list.length;
    const totalMinutes = list.reduce((sum, w) => sum + (w.duration ?? 0), 0);
    const byMonth: Record<string, number> = {};
    for (const w of list) {
      const key = (w.date ?? '').slice(0, 7); // YYYY-MM
      if (!key) continue;
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }
    return { totalWorkouts, totalMinutes, byMonth };
  },

  // Sök via RestQuery (?where=...)
  search: async (query: string): Promise<WorkoutSession[]> => {
    const safe = query.replace(/'/g, "''");
    const r = await api.get(`/WorkoutSessions?where=${encodeURIComponent(`Name like '%${safe}%'`)}`);
    return (Array.isArray(r.data) ? r.data : [r.data]).map(toWorkout);
  }
};

//  Exercises 
export interface Exercise {
  id: number; name: string; category: string;
  description?: string | null; createdBy?: number | null; isPublic?: boolean;
}

export const exercisesAPI = {
  getAll: async (): Promise<Exercise[]> => {
    const r = await api.get('/Exercises');
    return (Array.isArray(r.data) ? r.data : [r.data]).map(toExercise);
  },

  getById: async (id: number): Promise<Exercise> => {
    const r = await api.get(`/Exercises/${id}`);
    return toExercise(r.data);
  },

  create: async (exercise: Omit<Exercise,'id'|'createdBy'>): Promise<Exercise> => {
    const r = await api.post('/Exercises', {
      Name: exercise.name,
      Category: exercise.category,
      Description: exercise.description ?? null
    });
    return toExercise(r.data);
  },

  update: async (id: number, exercise: Partial<Exercise>): Promise<Exercise> => {
    const r = await api.put(`/Exercises/${id}`, {
      ...(exercise.name !== undefined ? { Name: exercise.name } : {}),
      ...(exercise.category !== undefined ? { Category: exercise.category } : {}),
      ...(exercise.description !== undefined ? { Description: exercise.description } : {})
    });
    return toExercise(r.data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/Exercises/${id}`);
  },

  search: async (query: string, category?: string): Promise<Exercise[]> => {
    const parts: string[] = [];
    if (query)   parts.push(`Name like '%${query.replace(/'/g, "''")}%'`);
    if (category) parts.push(`Category='${category.replace(/'/g, "''")}'`);
    const where = parts.length ? `?where=${encodeURIComponent(parts.join(' AND '))}` : '';
    const r = await api.get(`/Exercises${where}`);
    return (Array.isArray(r.data) ? r.data : [r.data]).map(toExercise);
  }
};

// Goals 
export interface Goal {
  id: number; userId: number; title: string;
  targetValue: number; currentValue: number; unit?: string;
  targetDate?: string | null; isCompleted?: boolean; createdAt?: string | null;
}

export const goalsAPI = {
  getAll: async (): Promise<Goal[]> => {
    const r = await api.get('/Goals');
    return (Array.isArray(r.data) ? r.data : [r.data]).map(toGoal);
  },

  getById: async (id: number): Promise<Goal> => {
    const r = await api.get(`/Goals/${id}`);
    return toGoal(r.data);
  },

  create: async (goal: Omit<Goal,'id'|'userId'|'currentValue'|'isCompleted'|'createdAt'> & { userId?: number }): Promise<Goal> => {
    // Om userId behövs i DB, skicka med
    const r = await api.post('/Goals', {
      UserId: goal['userId' as keyof typeof goal],
      Title: goal.title,
      TargetValue: goal.targetValue,
      Unit: goal.unit ?? null,
      TargetDate: goal.targetDate ?? null
    });
    return toGoal(r.data);
  },

  update: async (id: number, goal: Partial<Goal>): Promise<Goal> => {
    const r = await api.put(`/Goals/${id}`, {
      ...(goal.title !== undefined ? { Title: goal.title } : {}),
      ...(goal.targetValue !== undefined ? { TargetValue: goal.targetValue } : {}),
      ...(goal.currentValue !== undefined ? { CurrentValue: goal.currentValue } : {}),
      ...(goal.unit !== undefined ? { Unit: goal.unit } : {}),
      ...(goal.targetDate !== undefined ? { TargetDate: goal.targetDate } : {}),
      ...(goal.isCompleted !== undefined ? { IsCompleted: goal.isCompleted ? 1 : 0 } : {})
    });
    return toGoal(r.data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/Goals/${id}`);
  },

  //  /goals/{id}/progress 
  updateProgress: async (id: number, progress: number): Promise<Goal> => {
    const r = await api.put(`/Goals/${id}`, { CurrentValue: progress });
    return toGoal(r.data);
  }
};

//  Export 
export interface ExportData {
  workouts: WorkoutSession[];
  exercises: Exercise[];
  goals: Goal[];
}

export const exportAPI = {
  exportToJSON: async (): Promise<ExportData> => {
    const [workouts, exercises, goals] = await Promise.all([
      workoutsAPI.getAll(), exercisesAPI.getAll(), goalsAPI.getAll()
    ]);
    return { workouts, exercises, goals };
  },

  exportToCSV: async (): Promise<string> => {
    const toCSV = (rows: any[]): string => {
      if (!rows.length) return '';
      const headers = Object.keys(rows[0]);
      const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const body = rows.map(r => headers.map(h => esc((r as any)[h])).join(','));
      return [headers.join(','), ...body].join('\n');
    };
    const data = await exportAPI.exportToJSON();
    const csvParts = [
      '--- Workouts ---',
      toCSV(data.workouts),
      '',
      '--- Exercises ---',
      toCSV(data.exercises),
      '',
      '--- Goals ---',
      toCSV(data.goals)
    ];
    return csvParts.join('\n');
  }
};

// ===== Admin (generisk via Users) =====
export const adminAPI = {
  getAllUsers: async (): Promise<User[]> => {
    const r = await api.get('/Users');
    const arr = Array.isArray(r.data) ? r.data : [r.data];
    return arr.map(toUser);
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/Users/${id}`);
  },

  updateUserRole: async (id: number, role: 'user' | 'admin'): Promise<User> => {
    const r = await api.put(`/Users/${id}`, { Role: role });
    return toUser(r.data);
  },

  getSystemStats: async () => {
    const [u, w, e, g] = await Promise.all([
      adminAPI.getAllUsers(), workoutsAPI.getAll(), exercisesAPI.getAll(), goalsAPI.getAll()
    ]);
    return {
      users: u.length,
      workouts: w.length,
      exercises: e.length,
      goals: g.length
    };
  }
};
