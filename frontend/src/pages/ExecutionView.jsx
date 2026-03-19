import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Loader2, CheckCircle2, XCircle, Clock, Terminal, ArrowRight, Ban, Circle, Zap, ChevronRight, Activity, Globe, Cpu } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ProgressBar = ({ steps, logs, currentStepId, status }) => {
    return (
        <div className="flex items-center w-full my-16 px-10 overflow-x-auto pb-10 custom-scrollbar scrollbar-hide">
            <div className="flex items-center min-w-max mx-auto">
                {steps.map((step, idx) => {
                    const isCompleted = logs.some(l => l.step_id === step.id) || (idx === steps.length - 1 && status === 'completed');
                    const isCurrent = step.id === currentStepId && status === 'in_progress';
                    const isFailed = status === 'failed' && isCurrent;

                    let icon = <Circle size={14} className="opacity-20" />;
                    if (isCompleted) icon = <CheckCircle2 size={18} className="text-white" strokeWidth={3} />;
                    else if (isFailed) icon = <XCircle size={18} className="text-white" strokeWidth={3} />;
                    else if (isCurrent) icon = <Activity size={18} className="text-white animate-pulse" strokeWidth={3} />;

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center relative gap-6 min-w-[140px] group">
                                <motion.div 
                                    initial={{ scale: 0.8 }} 
                                    animate={{ 
                                        scale: isCurrent ? 1.4 : 1,
                                        boxShadow: isCurrent ? '0 0 40px rgba(16,185,129,0.4)' : '0 0 0px rgba(0,0,0,0)'
                                    }}
                                    className={`w-14 h-14 rounded-[1.75rem] flex items-center justify-center z-10 transition-all duration-1000 border-2 ${
                                        isCompleted ? 'glass-emerald border-emerald-500/60' :
                                        isFailed ? 'bg-rose-500/20 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.3)]' :
                                        isCurrent ? 'glass border-emerald-400 bg-emerald-500/10' :
                                        'glass border-white/5 opacity-40 hover:opacity-100'
                                    }`}
                                >
                                    {icon}
                                </motion.div>
                                <div className="text-center">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] block transition-colors duration-700 ${isCurrent || isCompleted ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                        {step.name}
                                    </span>
                                    <span className="text-[8px] font-bold text-dim/30 uppercase tracking-widest mt-1 block">Phase {idx + 1}.0</span>
                                </div>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="w-24 h-[3px] bg-white/5 mx-2 rounded-full relative overflow-hidden shadow-inner">
                                    <motion.div 
                                        initial={{ width: '0%' }}
                                        animate={{ width: isCompleted ? '100%' : '0%' }}
                                        transition={{ duration: 1.2, ease: "circOut" }}
                                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const ExecutionView = () => {
    const { id: workflowId } = useParams();
    const navigate = useNavigate();
    const [workflow, setWorkflow] = useState(null);
    const [inputData, setInputData] = useState({});
    const [executing, setExecuting] = useState(false);
    const [execution, setExecution] = useState(null);
    const [polling, setPolling] = useState(false);
    const [confettiFired, setConfettiFired] = useState(false);

    useEffect(() => { fetchWorkflow(); }, [workflowId]);

    const fetchWorkflow = async () => {
        if (!workflowId || workflowId === 'undefined') return;
        try {
            const res = await api.get(`/workflows/${workflowId}`);
            setWorkflow(res.data);
            const initial = {};
            (res.data.input_schema?.properties || []).forEach(p => initial[p.name] = '');
            setInputData(initial);
        } catch (err) { toast.error('Grid Matrix Sync Error'); }
    };

    const handleStart = async () => {
        try {
            setExecuting(true);
            setConfettiFired(false);
            const res = await api.post(`/workflows/${workflowId}/execute`, { data: inputData, triggered_by: 'Protocol-X' });
            setExecution(res.data);
            setPolling(true);
            toast.success('Matrix Uplink Established');
        } catch (err) { toast.error('Uplink Refused'); setExecuting(false); }
    };

    const handleCancel = async () => {
        try {
            await api.post(`/executions/${execution.id}/cancel`);
            toast.success('Emergency Neutralization Requested');
        } catch (err) { toast.error('Neutralization Blocked'); }
    };

    const currentStepRow = workflow?.steps?.find(s => s.id === execution?.current_step_id);
    const requiredRole = currentStepRow?.metadata?.required_role || 'manager';
    const userStr = localStorage.getItem('wf_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const canApprove = user && (user.role === 'admin' || user.role === requiredRole);
    const isWaitingForApproval = execution?.status === 'in_progress' && currentStepRow?.step_type === 'approval';

    const handleApprove = async (approved) => {
        try {
            await api.post(`/executions/${execution.id}/approve`, { approved });
            toast.success(approved ? 'Clearance Granted' : 'Access Denied');
            const res = await api.get(`/executions/${execution.id}`);
            setExecution(res.data);
            checkCompletion(res.data.status);
        } catch (err) { toast.error('Biometric Signal Timeout'); }
    };

    const checkCompletion = (status) => {
        if (['completed', 'failed', 'canceled'].includes(status)) {
            setPolling(false);
            setExecuting(false);
            if (status === 'completed' && !confettiFired) {
                confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 }, colors: ['#10b981', '#34d399', '#fef3c7'] });
                setConfettiFired(true);
            }
        }
    };

    useEffect(() => {
        let interval;
        if (polling && execution?.id) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/executions/${execution.id}`);
                    setExecution(res.data);
                    checkCompletion(res.data.status);
                } catch (err) { setPolling(false); }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [polling, execution?.id, confettiFired]);

    if (!workflow) return <div className="h-screen flex items-center justify-center bg-black"><div className="w-20 h-20 border-8 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div></div>;

    const logs = Array.isArray(execution?.logs) ? execution.logs.map(l => typeof l === 'string' ? JSON.parse(l) : l) : [];

    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32">
            {/* Control Node Panel */}
            <div className="lg:col-span-4 space-y-10">
                <div className="glass p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden h-fit sticky top-10 mesh-gradient">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full"></div>
                    
                    <div className="flex items-center gap-6 mb-12">
                        <div className="p-5 glass-emerald rounded-[2rem] shadow-[0_15px_30px_rgba(16,185,129,0.2)]">
                            <Cpu size={32} className="text-emerald-400" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-main uppercase tracking-tighter italic">Initiator</h2>
                            <p className="text-[10px] font-black text-dim uppercase tracking-[0.4em] opacity-40 mt-1">Matrix v4.2 Uplink</p>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {workflow.input_schema?.properties && workflow.input_schema.properties.length > 0 ? (
                            workflow.input_schema.properties.map((prop, idx) => (
                                <div key={idx} className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] block ml-2">{prop.name} {prop.required && <span className="text-emerald-500">*</span>}</label>
                                    {prop.allowed_values ? (
                                        <select className="input-glass w-full !bg-zinc-950/60 !rounded-[1.75rem] font-bold text-sm cursor-pointer" value={inputData[prop.name] || ''} onChange={e => setInputData({...inputData, [prop.name]: e.target.value})} disabled={executing}>
                                            <option value="">-- SYNC SELECTION --</option>
                                            {prop.allowed_values.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    ) : (
                                        <input type={prop.type === 'number' ? 'number' : 'text'} className="input-glass w-full !bg-zinc-950/60 !rounded-[1.75rem] text-sm" value={inputData[prop.name] || ''} onChange={e => setInputData({...inputData, [prop.name]: prop.type === 'number' ? Number(e.target.value) : e.target.value})} disabled={executing} placeholder={`Matrix parameter: ${prop.name}`} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] block ml-2">Raw Payload Buffer</label>
                                <textarea className="input-glass w-full h-56 font-mono text-[11px] !bg-zinc-950/60 !rounded-[2.5rem] resize-none leading-relaxed" value={JSON.stringify(inputData, null, 2)} onChange={e => { try { setInputData(JSON.parse(e.target.value)) } catch(err) {} }} disabled={executing} />
                            </div>
                        )}
                    </div>

                    <div className="pt-12 space-y-6">
                        <button onClick={handleStart} disabled={executing} className="btn-emerald w-full group relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {executing ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} className="group-hover:scale-125 transition-all duration-700" fill="currentColor" />}
                            <span className="uppercase tracking-[0.3em] font-black text-[13px]">Invoke Sequence</span>
                        </button>
                        
                        {executing && (
                            <button onClick={handleCancel} className="w-full glass py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] text-zinc-600 hover:text-rose-500 hover:border-rose-500/40 transition-all active:scale-95 flex items-center justify-center gap-4 border-white/5 active:bg-rose-500/5">
                                <Ban size={20} strokeWidth={2.5} /> Emergency Abort
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Matrix Trace Panel */}
            <div className="lg:col-span-8 space-y-12">
                 {execution ? (
                     <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="space-y-12">
                        <div className="glass p-14 rounded-[4.5rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-visible mesh-gradient">
                            <div className="absolute top-0 right-0 p-10">
                                <div className={`flex items-center gap-4 px-8 py-3 rounded-full border shadow-3xl backdrop-blur-3xl transition-all duration-1000 ${
                                    execution.status === 'completed' ? 'glass-emerald border-emerald-500/50 text-emerald-400' :
                                    execution.status === 'failed' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                                    'glass border-emerald-400/60 text-emerald-400 shadow-emerald-500/20'
                                }`}>
                                    <div className={`w-3 h-3 rounded-full ${execution.status === 'completed' ? 'bg-emerald-400' : execution.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-400 animate-ping'}`}></div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{execution.status} protocol</span>
                                </div>
                            </div>

                            <div className="mb-8">
                               <h2 className="text-4xl font-black text-main uppercase tracking-tighter">Matrix Trace</h2>
                               <p className="text-[11px] font-black text-dim uppercase tracking-[0.5em] mt-3 opacity-40 italic">Biometric Real-Time Synchronization</p>
                            </div>

                            <ProgressBar steps={workflow.steps || []} logs={logs} currentStepId={execution.current_step_id} status={execution.status} />

                            <AnimatePresence mode="wait">
                                {isWaitingForApproval && (
                                    <motion.div initial={{ height: 0, opacity: 0, y: 20 }} animate={{ height: 'auto', opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, filter: 'blur(10px)' }} className="mb-14 glass shadow-[0_0_80px_rgba(245,158,11,0.2)] border border-amber-500/30 rounded-[3.5rem] p-12 overflow-hidden relative group">
                                        <div className="absolute top-0 left-0 w-3 h-full bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.6)] group-hover:bg-amber-400 transition-colors"></div>
                                        <div className="flex flex-col xl:flex-row items-center justify-between gap-12 relative z-10">
                                            <div className="flex items-center gap-8 text-center xl:text-left">
                                                <div className="p-6 glass border border-amber-500/40 rounded-[2rem] text-amber-500 bg-amber-500/10 shadow-2xl animate-pulse-soft">
                                                    <Activity className="animate-pulse" size={40} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-amber-500 uppercase tracking-tighter mb-2">Awaiting Clearance</h3>
                                                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">System Gateway Locked at <span className="text-amber-100 italic bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">{currentStepRow?.name}</span></p>
                                                </div>
                                            </div>
                                            {canApprove ? (
                                                <div className="flex gap-6 w-full xl:w-auto">
                                                    <button onClick={() => handleApprove(true)} className="btn-emerald flex-1 xl:flex-none !px-12 !py-5 flex items-center gap-4 text-sm shadow-[0_20px_40px_rgba(16,185,129,0.4)]">
                                                        <CheckCircle2 size={24} strokeWidth={3} /> GRANT CLEARANCE
                                                    </button>
                                                    <button onClick={() => handleApprove(false)} className="glass flex-1 xl:flex-none !px-12 !py-5 flex items-center gap-4 text-rose-500 border-rose-500/30 hover:bg-rose-500/20 font-black text-[11px] uppercase tracking-[0.3em] rounded-[2rem] transition-all active:scale-95 shadow-xl">
                                                        <XCircle size={24} strokeWidth={3} /> DENY ACCESS
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-4 w-full xl:w-auto p-6 glass rounded-[2rem] border-amber-500/30 text-amber-500 text-[12px] uppercase font-black tracking-[0.4em] flex items-center gap-4 shadow-2xl bg-amber-500/5">
                                                    <Clock size={20} className="animate-spin-slow" /> AWAITING {requiredRole} SIG-SIG
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-10 relative pl-12 mt-12">
                                <div className="absolute left-0 top-0 bottom-6 w-[3px] bg-gradient-to-b from-emerald-500/40 to-white/5 rounded-full"></div>
                                <AnimatePresence mode="popLayout">
                                    {logs.map((log, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.6 }} className="relative group">
                                            <div className={`absolute -left-[63px] top-8 w-6 h-6 rounded-full glass border-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all duration-1000 z-20 ${
                                                log.status === 'completed' ? 'border-emerald-500 bg-emerald-500 shadow-emerald-500/50' : 
                                                log.status === 'failed' ? 'border-rose-500 bg-rose-500 shadow-rose-500/50' :
                                                'border-emerald-400 bg-emerald-500/20 animate-pulse'
                                            }`}>
                                                {log.status === 'completed' && <CheckCircle2 size={13} className="text-white" strokeWidth={3} />}
                                                {log.status === 'failed' && <XCircle size={13} className="text-white" strokeWidth={3} />}
                                            </div>
                                            
                                            <div className="glass-card !p-10 hover:border-emerald-500/40 transition-all duration-700 relative overflow-hidden group/item hover:-translate-y-2 active:scale-[0.99] shadow-inner border border-white/5">
                                                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[80px] rounded-full group-hover/item:bg-emerald-500/10 transition-colors pointer-events-none"></div>
                                                
                                                <div className="flex justify-between items-start mb-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`p-4 rounded-2xl bg-zinc-950/80 shadow-2xl border border-white/5 ${log.step_type === 'webhook' ? 'text-indigo-400 group-hover/item:text-indigo-300' : 'text-emerald-400 group-hover/item:text-emerald-300'}`}>
                                                            {log.step_type === 'webhook' ? <Globe size={26} strokeWidth={2.5} /> : <Activity size={26} strokeWidth={2.5} />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-main uppercase tracking-tight text-2xl group-hover/item:text-emerald-400 transition-colors">{log.step_name}</h4>
                                                            <div className="flex items-center gap-4 mt-3">
                                                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] font-mono italic">{log.step_type} node</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-mono text-emerald-500/60 font-black input-glass !py-2 !px-4 !bg-emerald-500/5 !rounded-xl border border-emerald-500/20 uppercase tracking-[0.2em] shadow-inner">{new Date(log.started_at).toLocaleTimeString()}</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                                    <div className="glass p-6 rounded-[1.75rem] bg-zinc-950/40 border-white/5 shadow-inner hover:border-emerald-500/20 transition-all group/stat">
                                                        <p className="text-[9px] uppercase font-black text-zinc-600 mb-2 tracking-[0.4em] group-hover/stat:text-zinc-500">Node Logic</p>
                                                        <p className="text-xs font-black text-main uppercase tracking-tighter italic flex items-center gap-2 group-hover/stat:text-emerald-400">{log.step_type} core</p>
                                                    </div>
                                                    <div className="glass p-6 rounded-[1.75rem] bg-zinc-950/40 border-white/5 shadow-inner hover:border-emerald-500/20 transition-all group/stat">
                                                        <p className="text-[9px] uppercase font-black text-zinc-600 mb-2 tracking-[0.4em] group-hover/stat:text-zinc-500">Latency</p>
                                                        <p className="text-xs font-black text-main uppercase tracking-tighter group-hover/stat:text-emerald-400">{((new Date(log.ended_at) - new Date(log.started_at)) / 1000).toFixed(4)}s</p>
                                                    </div>
                                                    <div className="glass p-6 rounded-[1.75rem] bg-zinc-950/40 border-white/5 shadow-inner hover:border-emerald-500/20 transition-all group/stat">
                                                        <p className="text-[9px] uppercase font-black text-zinc-600 mb-2 tracking-[0.4em] group-hover/stat:text-zinc-500">Routing Next</p>
                                                        <p className="text-xs font-black text-emerald-500 uppercase tracking-tighter italic truncate group-hover/stat:text-emerald-400">{log.selected_next_step ? (workflow?.steps?.find(s => s.id === log.selected_next_step)?.name || 'Protocol Seq') : 'EOL Signal'}</p>
                                                    </div>
                                                </div>

                                                {log.webhook_response && (
                                                    <div className="mt-10 pt-10 border-t border-white/5">
                                                        <p className="text-[10px] uppercase font-black text-zinc-600 mb-6 tracking-[0.5em] flex items-center gap-3">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-pulse"></span>
                                                            Remote Node Sync Buffer
                                                        </p>
                                                        <div className="glass bg-zinc-950/80 p-8 rounded-[2rem] border border-white/5 font-mono text-[11px] text-zinc-400 overflow-auto max-h-80 leading-relaxed custom-scrollbar shadow-2xl">
                                                            <div className="flex items-center gap-4 mb-6 text-indigo-400 font-black uppercase text-[10px] tracking-widest border-b border-white/5 pb-4">
                                                                <ChevronRight size={14} strokeWidth={3} /> Status Index: {log.webhook_response.status}
                                                            </div>
                                                            <pre className="text-emerald-500/80 selection:bg-emerald-500/30">{JSON.stringify(log.webhook_response.data, null, 2)}</pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                                                    <div className="mt-10 pt-10 border-t border-white/5">
                                                        <p className="text-[10px] uppercase font-black text-zinc-600 mb-6 tracking-[0.5em] flex items-center gap-3">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"></span>
                                                            Rule Regression Analysis
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            {log.evaluated_rules.map((rule, idx) => (
                                                                <div key={idx} className={`glass px-6 py-5 rounded-[1.5rem] border flex items-center justify-between transition-all duration-500 ${rule.result ? 'border-emerald-500/40 bg-emerald-500/5 shadow-xl' : 'border-white/5 bg-zinc-950/30 opacity-40 grayscale'}`}>
                                                                    <div className="flex items-center gap-5 truncate">
                                                                        {rule.result ? <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div> : <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></div>}
                                                                        <span className="font-mono text-[11px] text-zinc-400 truncate tracking-tight">{rule.rule}</span>
                                                                    </div>
                                                                    <ChevronRight size={16} strokeWidth={3} className={rule.result ? 'text-emerald-500 animate-pulse' : 'text-zinc-800'} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                     </motion.div>
                 ) : (
                     <div className="h-full glass rounded-[4.5rem] border border-dashed border-zinc-900 flex flex-col items-center justify-center p-32 text-center space-y-12 min-h-[700px] relative overflow-hidden shadow-2xl mesh-gradient">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-[150px] rounded-full"></div>
                        <div className="p-10 glass rounded-[3rem] border border-white/5 text-zinc-800 animate-pulse-soft shadow-inner relative">
                            <Terminal size={100} strokeWidth={1} className="text-zinc-700/50" />
                            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>
                        </div>
                        <div>
                            <p className="font-black text-main text-4xl uppercase tracking-tighter mb-4 italic">Access Station 72</p>
                            <p className="text-dim font-black uppercase tracking-[0.5em] mt-4 opacity-40 text-[12px]">Awaiting Biometric Sequence Initializer</p>
                        </div>
                        <div className="flex gap-6">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-3 h-3 rounded-full bg-emerald-500/40 animate-pulse`} style={{ animationDelay: `${i * 0.15}s`, opacity: 1 - (i*0.15) }}></div>)}
                        </div>
                     </div>
                 )}
            </div>
        </motion.div>
    );
};

export default ExecutionView;
