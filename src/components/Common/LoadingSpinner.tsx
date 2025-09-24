import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | undefined;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = 'Laddar...', size }) => {
  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      <div className={`spinner-border ${size === 'sm' ? 'spinner-border-sm' : ''} me-2`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      <span>{text}</span>
    </div>
  );
};

export default LoadingSpinner;