import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;
      localStorage.setItem('wf_token', token);
      localStorage.setItem('wf_user', JSON.stringify(user));
      
      // Redirect based on role
      if (user.role === 'manager' || user.role === 'ceo') {
        navigate('/approvals');
      } else {
        navigate('/workflows');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl mb-6" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Activity size={36} className="text-emerald-400" strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">HALLEYX</h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Workflow Engine</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">Sign In</h2>
          <p className="text-xs text-zinc-500 mb-8">Use your organization credentials</p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl text-xs font-bold text-red-400 uppercase tracking-widest" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange} required autoFocus
                className="w-full px-5 py-4 rounded-2xl text-sm font-semibold text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required
                  className="w-full px-5 py-4 rounded-2xl text-sm font-semibold text-white outline-none transition-all pr-12"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">Register</Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-5 rounded-3xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono">
            <div><span className="text-zinc-500">Admin:</span> admin@company.com / Admin@123</div>
            <div><span className="text-zinc-500">Manager:</span> manager@company.com / Manager@123</div>
            <div><span className="text-zinc-500">CEO:</span> ceo@company.com / CEO@123</div>
            <div><span className="text-zinc-500">Employee:</span> employee@company.com / Employee@123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
