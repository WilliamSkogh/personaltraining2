import { useState, useEffect } from 'react';
import { WorkoutSession, CreateWorkoutRequest } from '../types';
import { workoutsAPI } from '../services/api';

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const data = await workoutsAPI.getAll();
      setWorkouts(data);
      setError(null);
    } catch (err) {
      setError('Kunde inte ladda träningspass');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const createWorkout = async (workout: CreateWorkoutRequest) => {
    try {
      const newWorkout = await workoutsAPI.create(workout);
      setWorkouts(prev => [newWorkout, ...prev]);
      return newWorkout;
    } catch (err) {
      setError('Kunde inte skapa träningspass');
      throw err;
    }
  };

  const updateWorkout = async (id: number, workout: Partial<CreateWorkoutRequest>) => {
    try {
      const updatedWorkout = await workoutsAPI.update(id, workout);
      setWorkouts(prev => prev.map(w => w.id === id ? updatedWorkout : w));
      return updatedWorkout;
    } catch (err) {
      setError('Kunde inte uppdatera träningspass');
      throw err;
    }
  };

  const deleteWorkout = async (id: number) => {
    try {
      await workoutsAPI.delete(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      setError('Kunde inte ta bort träningspass');
      throw err;
    }
  };

  const searchWorkouts = async (query: string) => {
    try {
      setLoading(true);
      const results = await workoutsAPI.search(query);
      setWorkouts(results);
      setError(null);
    } catch (err) {
      setError('Kunde inte söka träningspass');
    } finally {
      setLoading(false);
    }
  };

  return {
    workouts,
    loading,
    error,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    searchWorkouts,
    refetch: fetchWorkouts
  };
};