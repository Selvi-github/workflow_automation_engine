import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
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

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("UI Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-emerald-500 font-bold p-10 text-center">
          <div>
            <h1 className="text-4xl mb-4">🛸 LOGIC BREACH</h1>
            <p className="text-zinc-500 uppercase tracking-widest text-xs">The UI has encountered an unhandled exception in the production layer.</p>
            <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 border border-emerald-500/20 rounded-full hover:bg-emerald-500/10 transition-all">REBOOT SYSTEM</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    console.log("🚀 App Initialized | Theme:", theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes wrapped in Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
               <Route index element={<Navigate to="/workflows" replace />} />
               <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
               <Route path="/workflows" element={<WorkflowList />} />
               <Route path="/workflow/:id" element={<WorkflowEditor />} />
               <Route path="/rules/:id" element={<RuleEditor />} />
               <Route path="/execute/:id" element={<ExecutionView />} />
               <Route path="/approvals" element={<ProtectedRoute allowedRoles={['manager', 'ceo', 'admin']}><Approvals /></ProtectedRoute>} />
               <Route path="/audit" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'ceo']}><AuditLog /></ProtectedRoute>} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/workflows" replace />} />
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

