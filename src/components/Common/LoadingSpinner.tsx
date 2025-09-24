import React from 'react';

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Laddar...' }) => {
  return (
    <div className="text-center p-4">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">{text}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;