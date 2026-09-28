import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
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
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatbotPage />} />
              <Route path="/lessons/new" element={<CreateLessonPage />} />
              <Route path="/lessons/:id" element={<LessonWorkspacePage />} />
              <Route path="/lessons/:id/evidence" element={<EvidenceViewerPage />} />
              <Route path="/search" element={<CrossModalSearchPage />} />
              <Route path="/jobs" element={<ProcessingJobsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

