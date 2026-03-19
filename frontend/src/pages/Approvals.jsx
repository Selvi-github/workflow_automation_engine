import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

// Lightweight time ago helper (no external dep)
function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

const ROLE_COLORS = {
  manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ceo: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  admin: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const user = JSON.parse(localStorage.getItem('wf_user') || '{}');

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/executions/pending-approvals');
      setApprovals(res.data);
    } catch (err) {
      toast.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchApprovals]);

  const handleAction = async (id, approved) => {
    setActionId(id);
    try {
      await api.post(`/executions/${id}/approve`, { approved });
      toast.success(approved ? '✅ Step Approved!' : '❌ Step Rejected!');
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Role: {user.role?.toUpperCase()}</p>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">My Approvals</h1>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Actions waiting for your decision</p>
        </div>
        <button onClick={fetchApprovals} className="p-3 rounded-2xl text-zinc-500 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      ) : approvals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-6 rounded-3xl mb-6" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
            <Inbox size={40} className="text-emerald-500/40" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">All Clear</h3>
          <p className="text-sm text-zinc-600">No pending approvals for your role.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest mb-6">{approvals.length} pending action{approvals.length > 1 ? 's' : ''}</p>
          <AnimatePresence>
            {approvals.map((item) => {
              const requiredRole = item.step_metadata?.required_role || 'manager';
              const roleClass = ROLE_COLORS[requiredRole] || ROLE_COLORS.manager;
              const isExpanded = expanded[item.id];
              const isProcessing = actionId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="rounded-3xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-base font-black text-white uppercase tracking-tight truncate">{item.workflow_name}</h3>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${roleClass}`}>
                            {requiredRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock size={12} />
                          <span className="font-semibold">{item.step_name}</span>
                          <span>·</span>
                          <span>{timeAgo(item.started_at)}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleExpand(item.id)} className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* Expandable Data */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Submitted Data</p>
                            <div className="rounded-2xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
                              <pre>{JSON.stringify(item.data, null, 2)}</pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => handleAction(item.id, true)}
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, false)}
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
