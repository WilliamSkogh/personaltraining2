import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../Common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return React.createElement(LoadingSpinner, { text: 'Laddar...' });
  }

  if (!isAuthenticated) {
    return React.createElement(Navigate, { to: '/login', replace: true });
  }

  if (adminOnly && !isAdmin) {
    return React.createElement(Navigate, { to: '/dashboard', replace: true });
  }

  return React.createElement(React.Fragment, null, children);
};

export default ProtectedRoute;