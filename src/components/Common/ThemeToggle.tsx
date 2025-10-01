import React from 'react';
import { Button } from 'react-bootstrap';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={toggleTheme}
      className="d-flex align-items-center gap-2"
      title={theme === 'light' ? 'Byt till mörkt tema' : 'Byt till ljust tema'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
      <span className="d-none d-md-inline">
        {theme === 'light' ? 'Mörkt' : 'Ljust'}
      </span>
    </Button>
  );
};

export default ThemeToggle;