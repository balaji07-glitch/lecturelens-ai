import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ChatbotPage } from './pages/ChatbotPage.tsx';
import { CreateLessonPage } from './pages/CreateLessonPage.tsx';
import { LessonWorkspacePage } from './pages/LessonWorkspacePage.tsx';
import { EvidenceViewerPage } from './pages/EvidenceViewerPage.tsx';
import { CrossModalSearchPage } from './pages/CrossModalSearchPage.tsx';
import { ProcessingJobsPage } from './pages/ProcessingJobsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#080B16] text-[#F8FAFC]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Landing & Authentication Entrypoint */}
              <Route path="/" element={<LandingPage />} />

              {/* Protected Application Routes requiring active login */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatbotPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/new"
                element={
                  <ProtectedRoute>
                    <CreateLessonPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/:id"
                element={
                  <ProtectedRoute>
                    <LessonWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/:id/evidence"
                element={
                  <ProtectedRoute>
                    <EvidenceViewerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <CrossModalSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <ProcessingJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback wildcard redirects unauthenticated visitors to landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

