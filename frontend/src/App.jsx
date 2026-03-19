import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkflowList from './pages/WorkflowList';
import WorkflowEditor from './pages/WorkflowEditor';
import RuleEditor from './pages/RuleEditor';
import ExecutionView from './pages/ExecutionView';
import AuditLog from './pages/AuditLog';
import Dashboard from './pages/Dashboard';
import Approvals from './pages/Approvals';

// Theme Context
export const ThemeContext = createContext();

const AppShell = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen transition-colors duration-500 font-['Plus_Jakarta_Sans'] overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {children}
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/workflows" replace />} />

          {/* Protected routes with sidebar layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div className="flex min-h-screen font-['Plus_Jakarta_Sans']">
                <Sidebar />
                <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto"><Dashboard /></div>
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/workflows" element={
            <ProtectedRoute>
              <div className="flex min-h-screen font-['Plus_Jakarta_Sans']">
                <Sidebar />
                <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto"><WorkflowList /></div>
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/workflow/:id" element={
            <ProtectedRoute>
              <div className="flex min-h-screen font-['Plus_Jakarta_Sans']">
                <Sidebar />
                <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto"><WorkflowEditor /></div>
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/rules/:id" element={
            <ProtectedRoute>
              <div className="flex min-h-screen font-['Plus_Jakarta_Sans']">
                <Sidebar />
                <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto"><RuleEditor /></div>
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/execute/:id" element={
            <ProtectedRoute>
              <div className="flex min-h-screen font-['Plus_Jakarta_Sans']">
                <Sidebar />
                <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto"><ExecutionView /></div>
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/approvals" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'admin']}>
              <div className="flex min-h-screen font-['Plus_Jakarta_Sans']">
                <Sidebar />
                <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto"><Approvals /></div>
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/audit" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'ceo']}>
              <div className="flex min-h-screen font-['Plus_Jakarta_Sans']">
                <Sidebar />
                <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto"><AuditLog /></div>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>

        <Toaster position="bottom-right" toastOptions={{
          style: {
            borderRadius: '1.5rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            color: 'var(--foreground)',
            fontWeight: '800',
            fontSize: '11px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--glass-border)'
          }
        }} />
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
