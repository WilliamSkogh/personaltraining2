import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.body.className = theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark';
  }, [theme]);

  return { theme, toggleTheme, isDark: theme === 'dark' };
};