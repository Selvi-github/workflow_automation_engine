import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Edit3, Play, Trash2, ChevronLeft, ChevronRight, Loader2, Copy, FileText, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';
import toast from 'react-hot-toast';

const WorkflowList = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/workflows?search=${search}&status=${statusFilter}&page=${page}&limit=10`);
            setWorkflows(res.data);
        } catch (err) {
            toast.error('Failed to fetch workflows');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, [page, search, statusFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this workflow?')) return;
        try {
            await api.delete(`/workflows/${id}`);
            toast.success('Workflow deleted');
            fetchWorkflows();
        } catch (err) {
            toast.error('Failed to delete workflow');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            const loadingToast = toast.loading('Duplicating workflow...');
            const res = await api.get(`/workflows/${id}`);
            const wf = res.data;
            
            const newWfRes = await api.post('/workflows', {
                name: `${wf.name} (Copy)`,
                input_schema: wf.input_schema || { properties: [] },
                is_active: false
            });
            const newWfId = newWfRes.data.id;
            
            const stepIdMap = {};
            for (const step of wf.steps || []) {
                const newStepRes = await api.post(`/workflows/${newWfId}/steps`, {
                    name: step.name,
                    step_type: step.step_type,
                    step_order: step.step_order,
                    metadata: step.metadata || {}
                });
                stepIdMap[step.id] = newStepRes.data.id;
            }
            
            for (const step of wf.steps || []) {
                const newStepId = stepIdMap[step.id];
                for (const rule of step.rules || []) {
                    await api.post(`/steps/${newStepId}/rules`, {
                        condition: rule.condition,
                        priority: rule.priority,
                        next_step_id: rule.next_step_id ? stepIdMap[rule.next_step_id] : null
                    });
                }
            }
            
            if (wf.start_step_id && stepIdMap[wf.start_step_id]) {
                await api.put(`/workflows/${newWfId}`, {
                    start_step_id: stepIdMap[wf.start_step_id],
                });
            }
            
            toast.dismiss(loadingToast);
            toast.success('Workflow duplicated');
            fetchWorkflows();
        } catch (err) {
            toast.error('Failed to duplicate workflow');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-7xl mx-auto space-y-10 pb-20 pt-4"
        >
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tighter flex items-center gap-4">
                        <div className="p-3 glass-emerald rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <Zap size={28} strokeWidth={2.5} />
                        </div>
                        Automations
                    </h1>
                    <p className="text-dim font-medium mt-3 text-lg max-w-xl">
                        Design, deploy, and monitor your enterprise workflows with precision.
                    </p>
                </div>
                <Link 
                    to="/workflow/new" 
                    className="btn-emerald flex items-center gap-3 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                    <span>Create New Flow</span>
                </Link>
            </div>

            <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-2xl">
                <div className="p-8 border-b border-white/5 flex items-center gap-6 bg-white/[0.02]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Find an automation..."
                            className="input-glass w-full pl-14"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        className="input-glass min-w-[200px] cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Deployed Only</option>
                        <option value="inactive">Drafts Only</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-dim text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                            <tr>
                                <th className="px-6 py-6">Definition</th>
                                <th className="px-6 py-6 text-center">Version</th>
                                <th className="px-6 py-6">Architecture</th>
                                <th className="px-6 py-6">Deployment</th>
                                <th className="px-6 py-6 text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 justify-center">
                                            <div className="relative">
                                                <Loader2 className="animate-spin text-emerald-500" size={48} strokeWidth={1.5} />
                                                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse"></div>
                                            </div>
                                            <span className="font-bold text-xs uppercase tracking-[0.3em] text-zinc-600">Syncing with Grid...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : workflows.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-32 text-center">
                                        <div className="opacity-40">
                                            <FileText size={64} className="mx-auto text-zinc-800 mb-6" />
                                            <p className="font-black text-2xl text-zinc-600 mb-2">System Empty</p>
                                            <p className="text-sm font-medium text-zinc-700">Initialize your first automation to begin.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {workflows.map((wf, idx) => (
                                        <motion.tr 
                                            key={wf.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-7">
                                                <div className="font-black text-main text-lg group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{wf.name}</div>
                                                <div className="text-[10px] text-dim font-mono tracking-tighter uppercase mt-1">{wf.id.split('-')[0]}•••{wf.id.split('-').pop()}</div>
                                            </td>
                                            <td className="px-6 py-7 text-center">
                                                <span className="input-glass text-emerald-400 text-[11px] font-black px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
                                                    v{wf.version}
                                                </span>
                                            </td>
                                            <td className="px-6 py-7">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-emerald-500/5 text-emerald-400 text-xs font-black px-4 py-1.5 rounded-xl border border-emerald-500/10">
                                                        {wf.step_count || 0}
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic opacity-60">Modular Steps</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-7">
                                                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${wf.is_active ? 'glass-emerald ring-1 ring-emerald-500/20' : 'bg-zinc-950/40 text-zinc-600 border border-white/5'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${wf.is_active ? 'bg-emerald-400 animate-pulse-soft' : 'bg-zinc-800'}`}></div>
                                                    {wf.is_active ? 'Live' : 'Draft'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-7 text-right">
                                                <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <button 
                                                        onClick={() => navigate(`/execute/${wf.id}`)} 
                                                        className="p-3 text-emerald-400 hover:bg-emerald-500 hover:text-white glass border border-emerald-500/30 rounded-2xl transition-all active:scale-90"
                                                        title="Launch Grid"
                                                    >
                                                        <Play size={18} fill="currentColor" />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/workflow/${wf.id}`)} 
                                                        className="p-3 text-zinc-300 hover:bg-white/10 glass border border-white/10 rounded-2xl transition-all active:scale-90"
                                                        title="Configure"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDuplicate(wf.id)} 
                                                        className="p-3 text-zinc-400 hover:bg-white/10 glass border border-white/10 rounded-2xl transition-all active:scale-90"
                                                        title="Clone"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(wf.id)} 
                                                        className="p-3 text-zinc-600 hover:bg-red-500 hover:text-white glass border border-white/10 rounded-2xl transition-all active:scale-90"
                                                        title="Decommission"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-10 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Grid Phase {page}</div>
                    <div className="flex gap-4">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)}
                            className="p-4 glass rounded-2xl text-zinc-400 hover:text-emerald-400 disabled:opacity-10 transition-all active:scale-90"
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                        </button>
                        <button 
                            onClick={() => setPage(page + 1)}
                            disabled={workflows.length < 10}
                            className="p-4 glass rounded-2xl text-zinc-400 hover:text-emerald-400 disabled:opacity-10 transition-all active:scale-90"
                        >
                            <ChevronRight size={24} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WorkflowList;

