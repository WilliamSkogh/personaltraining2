import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import WorkoutsListPage from './pages/Workouts/WorkoutsListPage';
import CreateWorkoutPage from './pages/Workouts/CreateWorkoutPage';
import ExercisesPage from './pages/Exercises/ExercisesPage';
import GoalsPage from './pages/Goals/GoalsPage';

import 'bootstrap/dist/css/bootstrap.min.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/workouts" element={
              <ProtectedRoute>
                <WorkoutsListPage />
              </ProtectedRoute>
            } />
            <Route path="/workouts/new" element={
              <ProtectedRoute>
                <CreateWorkoutPage />
              </ProtectedRoute>
            } />
            <Route path="/exercises" element={
              <ProtectedRoute>
                <ExercisesPage />
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <GoalsPage />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<div>404 - Sida ej hittad</div>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;