import React, { useContext, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, History, Sun, Moon, Activity, CheckSquare, LogOut, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../App';

const ROLE_COLORS = {
  admin: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ceo: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  employee: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const NAV_BY_ROLE = {
  admin: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FileText size={20} />, label: 'Workflows', path: '/workflows' },
    { icon: <CheckSquare size={20} />, label: 'My Approvals', path: '/approvals' },
    { icon: <History size={20} />, label: 'Audit Log', path: '/audit' },
  ],
  manager: [
    { icon: <CheckSquare size={20} />, label: 'My Approvals', path: '/approvals' },
    { icon: <FileText size={20} />, label: 'Workflows', path: '/workflows' },
  ],
  ceo: [
    { icon: <CheckSquare size={20} />, label: 'My Approvals', path: '/approvals' },
    { icon: <FileText size={20} />, label: 'Workflows', path: '/workflows' },
  ],
  employee: [
    { icon: <FileText size={20} />, label: 'Workflows', path: '/workflows' },
  ],
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const userJson = localStorage.getItem('wf_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const role = user?.role || 'employee';
  const menuItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.employee;
  const roleClass = ROLE_COLORS[role] || ROLE_COLORS.employee;

  const handleLogout = useCallback(() => {
    localStorage.removeItem('wf_token');
    localStorage.removeItem('wf_user');
    navigate('/login');
  }, [navigate]);

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-white/5 transition-all duration-500 z-50 flex flex-col" style={{ background: 'var(--sidebar-bg)', backdropFilter: 'blur(30px)' }}>
      {/* Logo */}
      <div className="p-8 pb-6">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/workflows')}>
          <div className="p-3 glass-emerald rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform duration-500">
            <Activity size={24} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">HALLEYX</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-0.5 opacity-60">Engine V2.0</p>
          </div>
        </div>
      </div>

      {/* User Badge */}
      {user && (
        <div className="px-6 mb-6">
          <div className="glass bg-zinc-950/20 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <div className="p-2 rounded-xl bg-white/5 flex-shrink-0">
              <User size={14} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{user.name}</p>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${roleClass}`}>{role}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-4 space-y-2 flex-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group ${
                isActive 
                  ? 'glass-emerald shadow-[0_10px_30px_rgba(16,185,129,0.1)]' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5 hover:translate-x-2'
              }`
            }
          >
            {item.icon}
            <span className="text-sm font-black uppercase tracking-widest flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div className="p-6 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full glass bg-zinc-950/20 p-4 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-emerald-500/20 transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-emerald-500" /> : <Sun size={18} className="text-amber-500" />}
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
              {theme === 'dark' ? 'Night Mode' : 'Day Mode'}
            </span>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors duration-500 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-emerald-500'}`}>
            <motion.div animate={{ x: theme === 'dark' ? 2 : 18 }} className="w-3 h-3 bg-white rounded-full absolute top-0.5" />
          </div>
        </button>

        {/* Logout */}
        {user && (
          <button
            onClick={handleLogout}
            className="w-full p-4 rounded-2xl flex items-center gap-3 text-zinc-500 hover:text-red-400 transition-all active:scale-95 group border border-white/5 hover:border-red-500/20"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <LogOut size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
          </button>
        )}

        {/* System Health */}
        <div className="glass bg-emerald-500/5 p-4 rounded-[2rem] border border-emerald-500/10 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Health</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-xs font-black text-white uppercase tracking-tighter">ONLINE</p>
            <p className="text-[9px] font-bold text-zinc-500 opacity-60 uppercase">99.9%</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
