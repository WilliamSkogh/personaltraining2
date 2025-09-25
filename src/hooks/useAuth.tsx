import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, type LoginCredentials, type User } from '../services/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);

      const me = await authAPI.getCurrentUser();
      setUser(me ?? null);
    } catch {

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {

    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {

      const { user: loggedIn } = await authAPI.login(credentials);
      setUser(loggedIn ?? null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Inloggningen misslyckades. Kontrollera e-post och lösenord.';
      setError(msg);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.logout();
      setUser(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Utloggningen misslyckades.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    login,
    logout,
    refresh
  }), [user, loading, error, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth måste användas inom <AuthProvider>');
  return ctx;
};
