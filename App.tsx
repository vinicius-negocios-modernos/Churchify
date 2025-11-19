
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EpisodeCreator } from './pages/EpisodeCreator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { isFirebaseConfigured } from './lib/firebase';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

// Tela de erro se faltar config
const ConfigErrorScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
    <div className="max-w-lg bg-white p-8 rounded-xl shadow-lg text-center">
      <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="text-red-600 w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Configuração Necessária</h2>
      <p className="text-gray-600 mb-4">O Firebase não foi configurado corretamente no arquivo <code className="bg-gray-100 px-2 py-1 rounded text-sm">lib/firebase.ts</code>.</p>
      <p className="text-sm text-gray-500">Crie um projeto no Firebase Console, ative o Auth e Firestore, e cole as chaves no código.</p>
    </div>
  </div>
);

export default function App() {
  if (!isFirebaseConfigured) return <ConfigErrorScreen />;

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          {/* Rota dinâmica: /editor/campos85/ID_DO_CULTO */}
          <Route path="/editor/:campusId/:episodeId" element={
            <PrivateRoute>
              <EpisodeCreator />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
