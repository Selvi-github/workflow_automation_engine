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
        } catch (err) { toast.error('Registry Access Denied'); } finally { setLoading(false); }
    };

    const handleViewLogs = async (id) => {
        try {
            const res = await api.get(`/executions/${id}`);
            setExecutionDetails(res.data);
            setSelectedExecutionId(id);
        } catch(err) { toast.error('Trace Retrieval Fault'); }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return 'glass-emerald border-emerald-500/40 text-emerald-400';
            case 'failed': return 'bg-rose-500/15 border-rose-500/40 text-rose-500';
            case 'in_progress': return 'glass border-emerald-400/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
            case 'canceled': return 'glass border-white/10 text-zinc-600 opacity-60';
            default: return 'glass border-white/5 text-zinc-700';
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'approval': return <User size={18} />;
            case 'notification': return <Bell size={18} />;
            case 'webhook': return <Globe size={18} />;
            default: return <Activity size={18} />;
        }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="max-w-7xl mx-auto space-y-16 pb-32">
            {/* Super Senior Audit Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-14 glass rounded-[4rem] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-hidden group mesh-gradient">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>
                <div className="flex items-center gap-10 relative z-10">
                    <div className="p-7 glass-emerald rounded-[3rem] shadow-[0_20px_50px_rgba(16,185,129,0.2)] border border-emerald-500/30">
                        <History size={44} strokeWidth={2.5} className="text-emerald-400 opacity-80" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-main tracking-tighter uppercase mb-2 italic">Immutable Records</h1>
                        <p className="text-[12px] font-black text-dim mt-1 uppercase tracking-[0.4em] opacity-40 italic">System Telemetry v4.2.0</p>
                    </div>
                </div>
                <div className="mt-10 lg:mt-0 flex gap-4 p-4 glass rounded-3xl border border-white/5 z-10">
                    <div className="flex items-center gap-3 px-6 py-2 border-r border-white/5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/50 animate-pulse"></span>
                        <span className="text-[11px] font-black text-dim uppercase tracking-widest">Grid Online</span>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-2">
                        <span className="text-[11px] font-black text-main uppercase tracking-widest">{executions.length} ENTRIES</span>
                    </div>
                </div>
            </div>

            <div className="glass rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto custom-scrollbar scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-950/40 text-dim text-[11px] font-black uppercase tracking-[0.4em] border-b border-white/5">
                            <tr>
                                <th className="px-10 py-8">Sector ID</th>
                                <th className="px-10 py-8">Target Protocol</th>
                                <th className="px-10 py-8">Status Node</th>
                                <th className="px-10 py-8">Initiator</th>
                                <th className="px-10 py-8">Log Time</th>
                                <th className="px-10 py-8 text-center">Telemetry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading ? (
                                <tr><td colSpan="6" className="px-10 py-40 text-center text-emerald-500/60 font-black tracking-[0.8em] uppercase animate-pulse italic text-lg">Synchronizing Registry...</td></tr>
                            ) : executions.length === 0 ? (
                                <tr><td colSpan="6" className="px-10 py-40 text-center text-zinc-800 italic font-black text-xl uppercase tracking-[0.4em]">Zero Signal Detected</td></tr>
                            ) : (
                                executions.map((ex, idx) => (
                                    <tr key={ex.id} className="hover:bg-emerald-500/[0.02] transition-all group cursor-pointer relative" onClick={() => handleViewLogs(ex.id)}>
                                        <td className="px-10 py-7 font-mono text-[11px] font-black text-zinc-600 group-hover:text-emerald-500 transition-colors uppercase tracking-widest border-l-4 border-transparent group-hover:border-emerald-500 transition-all duration-500">
                                            #{ex.id.split('-')[0]}
                                        </td>
                                        <td className="px-10 py-7 font-black text-main text-lg tracking-tighter uppercase group-hover:text-emerald-400 transition-colors">
                                            {ex.workflow_name || 'System Protocol'}
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border flex items-center justify-center gap-3 w-fit transition-all duration-700 ${getStatusStyle(ex.status)}`}>
                                                <div className={`w-2 h-2 rounded-full ${ex.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-current shadow-lg'}`}></div>
                                                {ex.status}
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                             <div className="flex items-center gap-3 text-[11px] font-black text-dim uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                                                <div className="w-8 h-8 rounded-full glass border border-white/5 flex items-center justify-center bg-zinc-950/40">{ex.triggered_by?.charAt(0) || 'P'}</div>
                                                {ex.triggered_by || 'Unknown'}
                                             </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-mono text-dim font-black uppercase tracking-tighter">{new Date(ex.started_at).toLocaleDateString()}</span>
                                                <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest opacity-60">{new Date(ex.started_at).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7 text-center">
                                            <button className="w-14 h-14 glass text-emerald-400 hover:text-white hover:bg-emerald-500 hover:border-emerald-400/50 rounded-2xl transition-all duration-500 flex items-center justify-center border border-white/5 group-hover:shadow-[0_10px_30px_rgba(16,185,129,0.2)] active:scale-90 mx-auto">
                                                <Eye size={22} strokeWidth={2.5} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-10 border-t border-white/5 flex justify-between items-center bg-zinc-950/20">
                    <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }} disabled={page === 1} className="p-5 glass rounded-[2rem] hover:bg-emerald-500/10 disabled:opacity-5 transition-all text-zinc-500 hover:text-emerald-400 active:scale-90 border border-white/5 shadow-2xl">
                        <ChevronLeft size={28} strokeWidth={3} />
                    </button>
                    <div className="flex items-center gap-8">
                        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.6em] mb-2 opacity-40">Registry Page</span>
                            <span className="text-2xl font-black text-emerald-400 tracking-tighter italic">{page.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-white/10"></div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }} disabled={executions.length < 10} className="p-5 glass rounded-[2rem] hover:bg-emerald-500/10 disabled:opacity-5 transition-all text-zinc-500 hover:text-emerald-400 active:scale-90 border border-white/5 shadow-2xl">
                        <ChevronRight size={28} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Side Drawer for Details */}
            <AnimatePresence>
                {selectedExecutionId && executionDetails && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setSelectedExecutionId(null)} />
                        <motion.div initial={{ x: '100%', skewX: '2deg' }} animate={{ x: 0, skewX: '0deg' }} exit={{ x: '100%', skewX: '-2deg' }} transition={{ type: 'spring', damping: 25, stiffness: 180 }} className="relative w-full max-w-3xl bg-zinc-950/95 h-full shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col border-l border-white/10 backdrop-blur-[100px] overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600"></div>
                            
                            <div className="p-16 border-b border-white/5 flex justify-between items-start relative mesh-gradient">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] -z-10 animate-pulse-soft"></div>
                                <div>
                                    <h2 className="text-4xl font-black text-main uppercase tracking-tighter italic mb-4">Trace Uplink</h2>
                                    <div className="flex items-center gap-4">
                                        <div className="px-5 py-2.5 glass-emerald border-emerald-500/30 rounded-2xl flex items-center gap-3 shadow-2xl">
                                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-ping"></div>
                                             <span className="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-widest">{selectedExecutionId.split('-')[0]}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-dim uppercase tracking-[0.3em] opacity-40 italic">Vector Synchronization</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedExecutionId(null)} className="p-5 glass text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-[2rem] transition-all active:scale-90 border border-white/5 shadow-2xl hover:rotate-90 duration-500">
                                    <X size={28} strokeWidth={3} />
                                </button>
                            </div>
                            
                            <div className="p-16 overflow-y-auto flex-1 custom-scrollbar pb-40">
                                {(!executionDetails.logs || executionDetails.logs.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center space-y-12 py-32 opacity-20 filter grayscale">
                                        <div className="p-14 glass rounded-[4rem] border border-white/5 animate-pulse-soft">
                                            <Terminal size={100} strokeWidth={1} />
                                        </div>
                                        <p className="text-[12px] uppercase font-black tracking-[0.8em] text-white">SIGNAL NULL</p>
                                    </div>
                                ) : (
                                    <div className="relative isolate">
                                        <div className="absolute left-[39px] top-10 bottom-10 w-[3px] bg-gradient-to-b from-emerald-500/30 via-white/5 to-transparent rounded z-0"></div>
                                        <div className="space-y-12">
                                            {(executionDetails.logs || []).map((logStr, i) => {
                                                const log = typeof logStr === 'string' ? JSON.parse(logStr) : logStr;
                                                const duration = ((new Date(log.ended_at) - new Date(log.started_at)) / 1000).toFixed(4);
                                                
                                                return (
                                                    <motion.div initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={{ delay: i * 0.12, duration: 0.8 }} key={i} className="relative z-10 flex gap-14 group/log">
                                                        <div className={`w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center flex-shrink-0 shadow-2xl transition-all duration-1000 relative group-hover/log:scale-110 z-20 ${
                                                            log.status === 'completed' ? 'glass-emerald border-emerald-500/40 text-emerald-400' : 
                                                            log.status === 'failed' ? 'bg-rose-500/10 border-rose-500/40 text-rose-500' : 
                                                            'glass border-white/10 text-zinc-700'
                                                        }`}>
                                                            {getTypeIcon(log.step_type)}
                                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 glass border-white/5 rounded-lg flex items-center justify-center font-black text-[9px] text-dim">{i+1}</div>
                                                        </div>
                                                        <div className="flex-1 glass-card !p-12 hover:border-emerald-500/30 transition-all duration-700 relative overflow-hidden active:scale-[0.98] shadow-3xl">
                                                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[70px] rounded-full opacity-0 group-hover/log:opacity-100 transition-opacity"></div>
                                                            <div className="flex justify-between items-start mb-10">
                                                                <div>
                                                                    <h4 className="font-black text-main text-2xl tracking-tighter uppercase group-hover/log:text-emerald-400 transition-colors mb-2 italic">{log.step_name}</h4>
                                                                    <div className="flex items-center gap-4 mt-4">
                                                                        <span className="text-[10px] font-black uppercase text-dim bg-zinc-950 px-3 py-1.5 rounded-lg border border-white/5 tracking-[0.3em] font-mono">{log.step_type}</span>
                                                                        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                                                                        <span className="text-[10px] font-black text-emerald-500 flex items-center gap-2 uppercase tracking-[0.2em] italic"><Clock size={14} className="animate-pulse" /> {duration} SEC</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] border shadow-2xl transition-all duration-700 ${getStatusStyle(log.status)}`}>{log.status}</div>
                                                            </div>

                                                            {log.webhook_response && (
                                                                <div className="mt-12 pt-10 border-t border-white/5">
                                                                    <p className="text-[10px] uppercase font-black text-zinc-500 mb-6 tracking-[0.6em] flex items-center gap-3">
                                                                        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                                                                        Payload Buffer
                                                                    </p>
                                                                    <div className="glass bg-zinc-950/90 p-8 rounded-3xl border border-white/5 font-mono text-[11px] text-emerald-400/60 overflow-auto max-h-80 leading-relaxed custom-scrollbar shadow-inner selection:bg-emerald-500/30">
                                                                        <div className="text-indigo-400 font-black mb-4 flex items-center justify-between text-[10px] uppercase tracking-widest border-b border-white/5 pb-4">
                                                                            <span>Remote API response</span>
                                                                            <span>HTTP {log.webhook_response.status}</span>
                                                                        </div>
                                                                        <pre className="text-emerald-500/70">{JSON.stringify(log.webhook_response.data, null, 2)}</pre>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                                                                <div className="mt-12 bg-zinc-950/60 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative">
                                                                    <p className="text-[11px] uppercase font-black text-dim mb-8 tracking-[0.5em] flex items-center gap-4">
                                                                        Logic Sub-Process
                                                                    </p>
                                                                    <div className="grid grid-cols-1 gap-4">
                                                                        {log.evaluated_rules.map((rule, idx) => (
                                                                            <div key={idx} className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 group/rule ${rule.result ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 opacity-30 grayscale'}`}>
                                                                                <div className="flex gap-6 items-center truncate">
                                                                                    {rule.result ? <CheckCircle2 size={18} className="text-emerald-400" strokeWidth={3} /> : <XCircle size={18} className="text-zinc-800" strokeWidth={3} />}
                                                                                    <span className="font-mono text-[11px] text-zinc-400 truncate tracking-tight">{rule.rule}</span>
                                                                                </div>
                                                                                {rule.result && <ChevronRight size={18} strokeWidth={3} className="text-emerald-500 animate-pulse group-hover/rule:translate-x-1 transition-transform" />}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {log.selected_next_step && (
                                                                <div className="mt-10 flex items-center gap-4 glass bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/30 shadow-2xl group/next transition-all hover:-translate-y-1">
                                                                    <div className="w-10 h-10 rounded-full glass border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover/next:scale-110 transition-transform"><ArrowRight size={20} className="animate-pulse" /></div>
                                                                    <div>
                                                                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] block mb-1">Vector Shift</span> 
                                                                        <span className="text-[13px] font-black text-main uppercase tracking-tighter italic">{log.selected_next_step}</span>
                                                                    </div>
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
