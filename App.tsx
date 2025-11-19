import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewEpisode } from './pages/NewEpisode';
import { Loader2 } from 'lucide-react';

// Component to protect routes that require authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="new-episode" element={<NewEpisode />} />
          <Route path="library" element={<div className="p-8 text-gray-500">Biblioteca em desenvolvimento...</div>} />
          <Route path="settings" element={<div className="p-8 text-gray-500">Configurações em desenvolvimento...</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}