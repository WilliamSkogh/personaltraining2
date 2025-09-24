import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';


console.log('AuthProvider:', AuthProvider);
console.log('Layout:', Layout);


const LoginPage = () => (
  <div className="text-center">
    <h2>Login Page</h2>
    <p>Login-formulär kommer här</p>
  </div>
);

const RegisterPage = () => (
  <div className="text-center">
    <h2>Register Page</h2>
    <p>Registrerings-formulär kommer här</p>
  </div>
);

const DashboardPage = () => (
  <div className="text-center">
    <h2>Dashboard</h2>
    <p>Dashboard-innehåll kommer här</p>
  </div>
);

const App: React.FC = () => {

  if (!AuthProvider) {
    return <div>Error: AuthProvider is undefined</div>;
  }
  
  if (!Layout) {
    return <div>Error: Layout is undefined</div>;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>
          <Route path="*" element={<div>404 - Sida ej hittad</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;