import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 animate-spin blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-400">Verifying security session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to landing/welcome page
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
