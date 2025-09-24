export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  description?: string;
  createdBy: number;
  isPublic: boolean;
}

export interface WorkoutSession {
  id: number;
  userId: number;
  name: string;
  date: string;
  duration?: number;
  notes?: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: number;
  workoutId: number;
  exerciseId: number;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  restTime?: number;
  notes?: string;
}

export interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  favoriteExercise: string;
  weeklyProgress: Array<{
    week: string;
    workouts: number;
    duration: number;
  }>;
}

export interface CreateWorkoutRequest {
  name: string;
  date: string;
  duration?: number;
  notes?: string;
  exercises: Array<{
    exerciseId: number;
    sets: number;
    reps: number;
    weight?: number;
    restTime?: number;
    notes?: string;
  }>;
}

export interface ExportData {
  workouts: WorkoutSession[];
  goals: Goal[];
  exportDate: string;
}