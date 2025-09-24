import { useState, useEffect } from 'react';
import { WorkoutStats } from '../types';
import { workoutsAPI } from '../services/api';

export const useStats = () => {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await workoutsAPI.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Kunde inte ladda statistik');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};