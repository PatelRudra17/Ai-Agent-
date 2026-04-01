import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useSocket from './hooks/useSocket';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import CursorGlow from './components/effects/CursorGlow';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail'));
const Tasks = lazy(() => import('./pages/Tasks'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const Messages = lazy(() => import('./pages/Messages'));
const Meetings = lazy(() => import('./pages/Meetings'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const AIChat = lazy(() => import('./pages/AIChat'));
const HR = lazy(() => import('./pages/HR'));
const Calls = lazy(() => import('./pages/Calls'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const Documents = lazy(() => import('./pages/Documents'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();
  useSocket();

  useEffect(() => {
    if (isAuthenticated) fetchUser();
  }, []);

  return (
    <>
    <CursorGlow />
    <PWAInstallPrompt />
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route path="/calls" element={<ProtectedRoute roles={['admin', 'manager']}><Calls /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute roles={['admin', 'manager']}><Employees /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute roles={['admin', 'manager']}><EmployeeDetail /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute roles={['admin', 'manager']}><Messages /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin', 'manager']}><Reports /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute roles={['admin', 'manager']}><ReportDetail /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={['admin', 'manager']}><Analytics /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/login" />} />
      </Routes>
    </Suspense>
    </ErrorBoundary>
    </>
  );
}
