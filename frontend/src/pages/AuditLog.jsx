import React, { useState, useEffect } from 'react';
import { History, Search, FileText, ChevronLeft, ChevronRight, Eye, X, CheckCircle2, XCircle, ArrowRight, User, Bell, Cpu, Clock, Activity, Globe } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AuditLog = () => {
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [selectedExecutionId, setSelectedExecutionId] = useState(null);
    const [executionDetails, setExecutionDetails] = useState(null);

    useEffect(() => { fetchExecutions(); }, [page]);

    const fetchExecutions = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/executions?page=${page}&limit=10`);
            setExecutions(res.data);
        } catch (err) { toast.error('History Retrieval Failed'); } finally { setLoading(false); }
    };

    const handleViewLogs = async (id) => {
        try {
            const res = await api.get(`/executions/${id}`);
            setExecutionDetails(res.data);
            setSelectedExecutionId(id);
        } catch(err) { toast.error('Trace Retrieval Failed'); }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return 'glass-emerald border-emerald-500/30 text-emerald-400';
            case 'failed': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
            case 'in_progress': return 'glass border-emerald-500/30 text-emerald-400 animate-pulse';
            case 'canceled': return 'glass border-white/10 text-zinc-500';
            default: return 'glass border-white/5 text-zinc-600';
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'approval': return <User size={16} />;
            case 'notification': return <Bell size={16} />;
            case 'webhook': return <Globe size={16} />;
            default: return <Activity size={16} />;
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-12 pb-24">
            <div className="flex justify-between items-center glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="p-4 glass-emerald rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <History size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-main tracking-tighter uppercase">Audit Matrix</h1>
                        <p className="text-[10px] font-bold text-dim mt-1 uppercase tracking-[0.4em] opacity-60 italic">Immutable Execution Records</p>
                    </div>
                </div>
            </div>

            <div className="glass rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="input-glass border-b border-white/5 text-dim text-[10px] font-black uppercase tracking-[0.3em]">
                            <tr>
                                <th className="px-8 py-6">Ref ID</th>
                                <th className="px-8 py-6">Protocol</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Signatory</th>
                                <th className="px-8 py-6">Timestamp</th>
                                <th className="px-8 py-6 text-right w-32">Observe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="px-8 py-24 text-center text-emerald-500 font-black tracking-[0.5em] uppercase animate-pulse italic">Accessing Records...</td></tr>
                            ) : executions.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-24 text-center text-zinc-700 italic font-bold">No telemetry data within this sector.</td></tr>
                            ) : (
                                executions.map((ex) => (
                                    <tr key={ex.id} className="hover:bg-white/[0.02] transition-all group">
                                        <td className="px-8 py-5 font-mono text-[10px] font-black text-dim group-hover:text-emerald-500 transition-colors uppercase tracking-widest">x-{ex.id.split('-')[0]}</td>
                                        <td className="px-8 py-5 font-black text-main text-sm tracking-tight uppercase group-hover:text-emerald-400 transition-colors">{ex.workflow_name || 'Archived Protocol'}</td>
                                        <td className="px-8 py-5">
                                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${getStatusStyle(ex.status)}`}>
                                                <div className={`w-1 h-1 rounded-full ${ex.status === 'completed' ? 'bg-emerald-400' : 'bg-current'}`}></div>
                                                {ex.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-[10px] font-black text-dim uppercase tracking-widest">{ex.triggered_by}</td>
                                        <td className="px-8 py-5 text-[10px] font-mono text-dim font-bold uppercase tracking-tighter">{new Date(ex.started_at).toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => handleViewLogs(ex.id)} className="glass text-emerald-400 hover:text-white hover:bg-emerald-500/20 px-5 py-2 rounded-xl transition-all text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-emerald-500/10 active:scale-95 mx-auto">
                                                <Eye size={14} strokeWidth={3} /> Inspect
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-white/5 flex justify-between items-center input-glass">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 glass rounded-2xl hover:bg-white/5 disabled:opacity-20 transition-all text-zinc-400 active:scale-90 border border-white/5">
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic opacity-60">Phase</span>
                        <span className="w-10 h-10 glass rounded-xl flex items-center justify-center font-black text-main text-sm border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">{page}</span>
                    </div>
                    <button onClick={() => setPage(p => p + 1)} disabled={executions.length < 10} className="p-3 glass rounded-2xl hover:bg-white/5 disabled:opacity-20 transition-all text-zinc-400 active:scale-90 border border-white/5">
                        <ChevronRight size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Side Drawer for Details */}
            <AnimatePresence>
                {selectedExecutionId && executionDetails && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedExecutionId(null)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }} className="relative w-full max-w-2xl bg-zinc-950/90 h-full shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col border-l border-white/5 backdrop-blur-[50px]">
                            <div className="p-10 border-b border-white/5 flex justify-between items-start bg-zinc-900/40 relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -z-10"></div>
                                <div>
                                    <h2 className="text-2xl font-black text-main uppercase tracking-tighter">Trace Sequence</h2>
                                    <p className="text-[9px] text-emerald-500 font-mono font-black mt-3 bg-white/5 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-inner flex items-center gap-2 uppercase tracking-widest leading-none">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        {selectedExecutionId}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedExecutionId(null)} className="p-3 glass text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all active:scale-90 border border-white/5">
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                            
                            <div className="p-10 overflow-y-auto flex-1 custom-scrollbar pb-32">
                                {(!executionDetails.logs || executionDetails.logs.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center space-y-6 py-40 text-zinc-800">
                                        <div className="p-8 glass rounded-[3rem] border border-white/5 animate-pulse">
                                            <History size={64} strokeWidth={1} />
                                        </div>
                                        <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-30 italic">No telemetry logs found for this session.</p>
                                    </div>
                                ) : (
                                    <div className="relative isolate px-4">
                                        <div className="absolute left-10 top-10 bottom-10 w-[2px] bg-white/[0.03] rounded z-0 shadow-inner"></div>
                                        <div className="space-y-8">
                                            {(executionDetails.logs || []).map((logStr, i) => {
                                                const log = typeof logStr === 'string' ? JSON.parse(logStr) : logStr;
                                                const duration = ((new Date(log.ended_at) - new Date(log.started_at)) / 1000).toFixed(3);
                                                
                                                return (
                                                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} key={i} className="relative z-10 flex gap-10">
                                                        <div className={`w-14 h-14 rounded-3xl border flex items-center justify-center flex-shrink-0 shadow-2xl transition-all duration-700 ${
                                                            log.status === 'completed' ? 'glass-emerald border-emerald-500/30 text-emerald-400 mt-2' : 
                                                            log.status === 'failed' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 mt-2' : 
                                                            'glass border-white/5 text-zinc-600 mt-2'
                                                        }`}>
                                                            {getTypeIcon(log.step_type)}
                                                        </div>
                                                        <div className="flex-1 glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl group hover:border-emerald-500/20 transition-all duration-500 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div>
                                                                    <h4 className="font-black text-main text-lg tracking-tight uppercase group-hover:text-emerald-400 transition-colors">{log.step_name}</h4>
                                                                    <div className="flex items-center gap-4 mt-3">
                                                                        <span className="text-[9px] font-black uppercase text-dim input-glass px-2.5 py-1.5 rounded-lg border border-white/5 tracking-[0.2em] italic">{log.step_type}</span>
                                                                        <span className="text-[10px] font-black text-emerald-500 flex items-center gap-2 uppercase tracking-tighter font-mono opacity-80"><Clock size={12} /> {duration}s</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(log.status)} shadow-lg`}>{log.status}</div>
                                                            </div>

                                                            {log.webhook_response && (
                                                                <div className="mt-8 pt-6 border-t border-white/5">
                                                                    <p className="text-[9px] uppercase font-black text-zinc-600 mb-4 tracking-[0.3em] flex items-center gap-2">
                                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                                                                        Remote Signal Payload
                                                                    </p>
                                                                    <div className="glass input-glass p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-emerald-500/70 overflow-auto max-h-60 leading-relaxed custom-scrollbar shadow-inner">
                                                                        <div className="text-indigo-400 font-black mb-2 flex items-center gap-2">HTTP {log.webhook_response.status} <ChevronRight size={10}/></div>
                                                                        <pre>{JSON.stringify(log.webhook_response.data, null, 2)}</pre>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                                                                <div className="mt-8 bg-zinc-950/40 rounded-3xl p-6 border border-white/5 shadow-inner">
                                                                    <p className="text-[9px] uppercase font-black text-dim mb-4 tracking-[0.3em] flex items-center gap-2">Logic Matrices</p>
                                                                    <div className="space-y-3">
                                                                        {log.evaluated_rules.map((rule, idx) => (
                                                                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${rule.result ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 opacity-40'}`}>
                                                                                <div className="flex gap-4 items-center">
                                                                                    {rule.result ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-zinc-800" />}
                                                                                    <span className="font-mono text-[10px] text-dim truncate tracking-tight">{rule.rule}</span>
                                                                                </div>
                                                                                {rule.result && <ChevronRight size={12} className="text-emerald-500" />}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {log.selected_next_step && (
                                                                <div className="mt-6 flex items-center gap-3 glass bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 shadow-inner group/node">
                                                                    <ArrowRight size={14} strokeWidth={3} className="text-emerald-500 transition-transform group-hover/node:translate-x-1" />
                                                                    <span className="text-[9px] font-black uppercase text-dim tracking-widest opacity-60">Redirect Phase:</span> 
                                                                    <span className="text-[11px] font-black text-main uppercase tracking-tight italic bg-white/5 px-2 py-1 rounded-lg border border-white/5">{log.selected_next_step}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AuditLog;
