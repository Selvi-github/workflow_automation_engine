import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';

const ROLES = ['employee', 'manager', 'ceo', 'admin'];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      const { token, user } = res.data;
      localStorage.setItem('wf_token', token);
      localStorage.setItem('wf_user', JSON.stringify(user));
      if (user.role === 'manager' || user.role === 'ceo') {
        navigate('/approvals');
      } else {
        navigate('/workflows');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl mb-6" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Activity size={36} className="text-emerald-400" strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">HALLEYX</h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Create Account</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">Register</h2>
          <p className="text-xs text-zinc-500 mb-8">Join your organization's workflow system</p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl text-xs font-bold text-red-400 uppercase tracking-widest" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required autoFocus
                className="w-full px-5 py-4 rounded-2xl text-sm font-semibold text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                className="w-full px-5 py-4 rounded-2xl text-sm font-semibold text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required
                  className="w-full px-5 py-4 rounded-2xl text-sm font-semibold text-white outline-none pr-12"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Role</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full px-5 py-4 rounded-2xl text-sm font-semibold text-white outline-none appearance-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {ROLES.map(r => <option key={r} value={r} style={{ background: '#09090b' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
