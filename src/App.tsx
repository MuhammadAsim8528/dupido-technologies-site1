import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import CookieConsent from './components/CookieConsent';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import AiChat from './pages/AiChat';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AuthCallback from './pages/AuthCallback';
import Verification from './pages/Verification';
import DashboardLayout from './pages/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Chat from './pages/dashboard/Chat';
import ApiKeys from './pages/dashboard/ApiKeys';
import Billing from './pages/dashboard/Billing';
import Security from './pages/dashboard/Security';
import Settings from './pages/dashboard/Settings';
import Docs from './pages/dashboard/Docs';
import UploadProject from './pages/dashboard/Upload';
import Library from './pages/dashboard/Library';
import Releases from './pages/dashboard/Releases';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/ai-chat" element={<AiChat />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/verification" element={<Verification />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="chat" element={<Chat />} />
              <Route path="library" element={<Library />} />
              <Route path="releases" element={<Releases />} />
              <Route path="upload" element={<UploadProject />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="billing" element={<Billing />} />
              <Route path="security" element={<Security />} />
              <Route path="docs" element={<Docs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CookieConsent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
