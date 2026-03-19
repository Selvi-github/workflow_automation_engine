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

          {/* Protected routes wrapped in Layout */}
          <Route element={<ProtectedRoute><Layout><div /></Layout></ProtectedRoute>}>
             <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
             <Route path="/workflows" element={<ProtectedRoute><Layout><WorkflowList /></Layout></ProtectedRoute>} />
             <Route path="/workflow/:id" element={<ProtectedRoute><Layout><WorkflowEditor /></Layout></ProtectedRoute>} />
             <Route path="/rules/:id" element={<ProtectedRoute><Layout><RuleEditor /></Layout></ProtectedRoute>} />
             <Route path="/execute/:id" element={<ProtectedRoute><Layout><ExecutionView /></Layout></ProtectedRoute>} />
             <Route path="/approvals" element={<ProtectedRoute allowedRoles={['manager', 'ceo', 'admin']}><Layout><Approvals /></Layout></ProtectedRoute>} />
             <Route path="/audit" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'ceo']}><Layout><AuditLog /></Layout></ProtectedRoute>} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/workflows" replace />} />
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

