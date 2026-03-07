import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChurchProvider } from '@/contexts/ChurchContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { OnboardingDialog } from '@/components/OnboardingDialog';

// Lazy-loaded route pages for code-splitting
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const NewEpisode = lazy(() => import('@/pages/NewEpisode').then(m => ({ default: m.NewEpisode })));
const LibraryPage = lazy(() => import('@/pages/LibraryPage').then(m => ({ default: m.LibraryPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));

// Loading fallback for lazy-loaded routes
const RouteLoadingFallback = () => (
  <div className="h-screen flex items-center justify-center bg-gray-50" role="status" aria-label="Carregando página">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
    <span className="sr-only">Carregando página...</span>
  </div>
);

// Component to protect routes that require authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50" role="status" aria-label="Carregando">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <ChurchProvider>
      <OnboardingDialog />
      {children}
    </ChurchProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="new-episode" element={<NewEpisode />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </AuthProvider>
    </ErrorBoundary>
  );
}