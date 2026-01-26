
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { EpisodeCreator } from './pages/EpisodeCreator';
import { AlertCircle } from 'lucide-react';
import { isFirebaseConfigured } from './lib/firebase';

// Tela de erro se faltar config
const ConfigErrorScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
    <div className="max-w-lg bg-white p-8 rounded-xl shadow-lg text-center">
      <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="text-red-600 w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Configuração Necessária</h2>
      <p className="text-gray-600 mb-4">O Firebase não foi configurado corretamente no arquivo <code className="bg-gray-100 px-2 py-1 rounded text-sm">lib/firebase.ts</code>.</p>
      <p className="text-sm text-gray-500">Crie um projeto no Firebase Console, ative o Firestore e Storage, e cole as chaves no código.</p>
    </div>
  </div>
);

export default function App() {
  if (!isFirebaseConfigured) return <ConfigErrorScreen />;

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Rota principal vai direto para o Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Rota do editor */}
          <Route path="/editor/:campusId/:episodeId" element={<EpisodeCreator />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
