import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Loader2, CheckCircle2, XCircle, Clock, Terminal, ArrowRight, Ban, Circle, Zap, ChevronRight, Activity, Globe } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ProgressBar = ({ steps, logs, currentStepId, status }) => {
    return (
        <div className="flex items-center w-full my-12 px-6 overflow-x-auto pb-6 custom-scrollbar">
            {steps.map((step, idx) => {
                const isCompleted = logs.some(l => l.step_id === step.id) || (idx === steps.length - 1 && status === 'completed');
                const isCurrent = step.id === currentStepId && status === 'in_progress';
                const isFailed = status === 'failed' && isCurrent;

                let icon = <Circle size={14} className="text-dim/40" />;
                if (isCompleted) icon = <CheckCircle2 size={16} className="text-white" />;
                else if (isFailed) icon = <XCircle size={16} className="text-white" />;
                else if (isCurrent) icon = <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>;

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center relative gap-4 min-w-[100px] group">
                            <motion.div 
                                initial={{ scale: 0.8 }} 
                                animate={{ scale: isCurrent ? 1.3 : 1 }}
                                className={`w-10 h-10 rounded-[1.25rem] flex items-center justify-center z-10 transition-all duration-700 border-2 ${
                                    isCompleted ? 'glass-emerald border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                    isFailed ? 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]' :
                                    isCurrent ? 'glass border-emerald-500 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)]' :
                                    'glass border-white/5 opacity-40'
                                }`}
                            >
                                {icon}
                            </motion.div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-center max-w-[100px] transition-colors duration-500 ${isCurrent || isCompleted ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                {step.name}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 h-[2px] bg-white/5 mx-4 relative overflow-hidden min-w-[40px] rounded-full">
                                <motion.div 
                                    initial={{ width: '0%' }}
                                    animate={{ width: isCompleted ? '100%' : '0%' }}
                                    transition={{ duration: 1, ease: "circOut" }}
                                    className="absolute left-0 top-0 bottom-0 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
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
        } catch (err) { toast.error('Protocol Load Failed'); }
    };

    const handleStart = async () => {
        try {
            setExecuting(true);
            setConfettiFired(false);
            const res = await api.post(`/workflows/${workflowId}/execute`, { data: inputData, triggered_by: 'Authorized Terminal' });
            setExecution(res.data);
            setPolling(true);
            toast.success('Sequence Initiated');
        } catch (err) { toast.error('Sequence Failed to Start'); setExecuting(false); }
    };

    const handleCancel = async () => {
        try {
            await api.post(`/executions/${execution.id}/cancel`);
            toast.success('Emergency Abort Requested');
        } catch (err) { toast.error('Abort Signal Failed'); }
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
            toast.success(approved ? 'Protocol Approved' : 'Protocol Terminated');
            const res = await api.get(`/executions/${execution.id}`);
            setExecution(res.data);
            checkCompletion(res.data.status);
        } catch (err) { toast.error(err.response?.data?.error || 'Signal Submission Error'); }
    };

    const checkCompletion = (status) => {
        if (['completed', 'failed', 'canceled'].includes(status)) {
            setPolling(false);
            setExecuting(false);
            if (status === 'completed' && !confettiFired) {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.7 }, colors: ['#10b981', '#059669', '#34d399'] });
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

    if (!workflow) return <div className="flex justify-center p-40"><div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div></div>;

    const logs = Array.isArray(execution?.logs) ? execution.logs.map(l => typeof l === 'string' ? JSON.parse(l) : l) : [];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-24">
            {/* Input Panel */}
            <div className="lg:col-span-4 space-y-8">
                <div className="glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden h-fit sticky top-8">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 glass-emerald rounded-2xl">
                            <Zap size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-main uppercase tracking-tighter">Initiator</h2>
                            <p className="text-[10px] font-bold text-dim uppercase tracking-widest opacity-60">Sequence Parameters</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {workflow.input_schema?.properties && workflow.input_schema.properties.length > 0 ? (
                            workflow.input_schema.properties.map((prop, idx) => (
                                <div key={idx} className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">{prop.name} {prop.required && <span className="text-emerald-500">*</span>}</label>
                                    {prop.allowed_values ? (
                                        <select className="input-glass w-full !py-3 font-bold" value={inputData[prop.name] || ''} onChange={e => setInputData({...inputData, [prop.name]: e.target.value})} disabled={executing}>
                                            <option value="">-- SELECT PROTOCOL --</option>
                                            {prop.allowed_values.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    ) : (
                                        <input type={prop.type === 'number' ? 'number' : 'text'} className="input-glass w-full !py-3" value={inputData[prop.name] || ''} onChange={e => setInputData({...inputData, [prop.name]: prop.type === 'number' ? Number(e.target.value) : e.target.value})} disabled={executing} placeholder={`Input data for ${prop.name}...`} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Payload Matrix (JSON)</label>
                                <textarea className="input-glass w-full h-48 font-mono text-xs resize-none" value={JSON.stringify(inputData, null, 2)} onChange={e => { try { setInputData(JSON.parse(e.target.value)) } catch(err) {} }} disabled={executing} />
                            </div>
                        )}
                    </div>

                    <div className="pt-8 space-y-4">
                        <button onClick={handleStart} disabled={executing} className="btn-emerald w-full !py-4 flex justify-center items-center gap-4 group">
                            {executing ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} className="group-hover:scale-125 transition-transform" />}
                            <span className="uppercase tracking-[0.2em] font-black text-xs">Execute Protocol</span>
                        </button>
                        
                        {executing && (
                            <button onClick={handleCancel} className="w-full glass py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-rose-500 hover:border-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Ban size={16} /> Signal Abort
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Trace Panel */}
            <div className="lg:col-span-8 space-y-10">
                 {execution ? (
                     <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                        <div className="glass p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-visible">
                            <div className="absolute top-0 right-0 p-8">
                                <div className={`flex items-center gap-3 px-6 py-2 rounded-full border shadow-2xl backdrop-blur-3xl ${
                                    execution.status === 'completed' ? 'glass-emerald border-emerald-500/30 text-emerald-400' :
                                    execution.status === 'failed' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                    'glass border-emerald-500/50 text-emerald-400 animate-pulse'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${execution.status === 'completed' ? 'bg-emerald-400' : execution.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-400 animate-ping'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{execution.status}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                               <h2 className="text-3xl font-black text-main uppercase tracking-tighter">Trace Engine</h2>
                               <p className="text-[10px] font-bold text-dim uppercase tracking-[0.4em] mt-2 opacity-50 italic">Live Stream Observer</p>
                            </div>

                            <ProgressBar steps={workflow.steps || []} logs={logs} currentStepId={execution.current_step_id} status={execution.status} />

                            <AnimatePresence>
                                {isWaitingForApproval && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-12 glass shadow-[0_0_50px_rgba(245,158,11,0.1)] border border-amber-500/20 rounded-[2.5rem] p-10 overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                            <div className="flex items-center gap-6">
                                                <div className="p-5 glass border border-amber-500/30 rounded-3xl text-amber-500 bg-amber-500/5">
                                                    <Activity className="animate-pulse" size={32} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-amber-500 uppercase tracking-tighter">Waiting for Human Signal</h3>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Gateway Blocked at: <span className="text-white italic">{currentStepRow?.name}</span></p>
                                                </div>
                                            </div>
                                            {canApprove ? (
                                                <div className="flex gap-4 w-full md:w-auto">
                                                    <button onClick={() => handleApprove(true)} className="btn-emerald flex-1 md:flex-none !px-8 py-4 flex items-center gap-3">
                                                        <CheckCircle2 size={20} /> Authorize
                                                    </button>
                                                    <button onClick={() => handleApprove(false)} className="glass flex-1 md:flex-none !px-8 py-4 flex items-center gap-3 text-rose-500 border-rose-500/20 hover:bg-rose-500/10 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95">
                                                        <XCircle size={20} /> Terminate
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-4 w-full md:w-auto p-4 glass rounded-2xl border-amber-500/20 text-amber-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-3">
                                                    <Clock size={16} className="animate-pulse" /> AWAITING {requiredRole} CLEARANCE
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-8 relative pl-10 mt-10">
                                <div className="absolute left-0 top-0 bottom-4 w-[2px] bg-white/[0.03] rounded-full"></div>
                                <AnimatePresence>
                                    {logs.map((log, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative group">
                                            <div className={`absolute -left-[50px] top-6 w-5 h-5 rounded-full glass border shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-700 z-10 ${
                                                log.status === 'completed' ? 'border-emerald-500 bg-emerald-500 shadow-emerald-500/30' : 
                                                log.status === 'failed' ? 'border-rose-500 bg-rose-500 shadow-rose-500/30' :
                                                'border-emerald-500 animate-ping'
                                            }`}>
                                                {log.status === 'completed' && <CheckCircle2 size={12} className="text-white" />}
                                                {log.status === 'failed' && <XCircle size={12} className="text-white" />}
                                            </div>
                                            
                                            <div className="glass-card hover:border-emerald-500/30 transition-all duration-500 !p-8 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
                                                
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-xl bg-white/5 ${log.step_type === 'webhook' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                                            {log.step_type === 'webhook' ? <Globe size={18} /> : <Activity size={18} />}
                                                        </div>
                                                        <h4 className="font-black text-main uppercase tracking-tight text-lg">{log.step_name}</h4>
                                                    </div>
                                                    <div className="text-[9px] font-mono text-dim input-glass px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest">{new Date(log.started_at).toLocaleTimeString()}</div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-6 mb-6">
                                                    <div className="glass p-4 rounded-2xl bg-zinc-950/20 border-white/5">
                                                        <p className="text-[9px] uppercase font-black text-zinc-600 mb-1 tracking-widest">Protocol Type</p>
                                                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-tighter italic">{log.step_type}</p>
                                                    </div>
                                                    <div className="glass p-4 rounded-2xl bg-zinc-950/20 border-white/5">
                                                        <p className="text-[9px] uppercase font-black text-zinc-600 mb-1 tracking-widest">Execution Time</p>
                                                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-tighter">{((new Date(log.ended_at) - new Date(log.started_at)) / 1000).toFixed(3)}s</p>
                                                    </div>
                                                    <div className="glass p-4 rounded-2xl bg-zinc-950/20 border-white/5">
                                                        <p className="text-[9px] uppercase font-black text-zinc-600 mb-1 tracking-widest">Resulting Next</p>
                                                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-tighter italic truncate">{log.selected_next_step ? (workflow?.steps?.find(s => s.id === log.selected_next_step)?.name || 'Next Node') : 'End Transmission'}</p>
                                                    </div>
                                                </div>

                                                {log.webhook_response && (
                                                    <div className="mt-8 pt-6 border-t border-white/5">
                                                        <p className="text-[9px] uppercase font-black text-zinc-500 mb-4 tracking-[0.3em] flex items-center gap-2">
                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                                                            External Payload Sync
                                                        </p>
                                                        <div className="glass bg-zinc-950/80 p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-zinc-400 overflow-auto max-h-60 leading-relaxed custom-scrollbar">
                                                            <div className="flex items-center gap-3 mb-4 text-indigo-400 font-black uppercase text-[9px] tracking-widest border-b border-white/5 pb-2">
                                                                <ChevronRight size={12} /> Status Code: {log.webhook_response.status}
                                                            </div>
                                                            <pre className="text-emerald-500/80">{JSON.stringify(log.webhook_response.data, null, 2)}</pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                                                    <div className="mt-8 pt-6 border-t border-white/5">
                                                        <p className="text-[9px] uppercase font-black text-zinc-500 mb-4 tracking-[0.3em] flex items-center gap-2">
                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                                            Decision Matrix Evaluation
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {log.evaluated_rules.map((rule, idx) => (
                                                                <div key={idx} className={`glass px-5 py-4 rounded-2xl border flex items-center justify-between transition-all ${rule.result ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-zinc-950/20 opacity-50'}`}>
                                                                    <div className="flex items-center gap-4 truncate">
                                                                        {rule.result ? <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> : <div className="w-2 h-2 rounded-full bg-rose-500/40"></div>}
                                                                        <span className="font-mono text-[10px] text-zinc-400 truncate tracking-tight">{rule.rule}</span>
                                                                    </div>
                                                                    <ChevronRight size={14} className={rule.result ? 'text-emerald-500' : 'text-zinc-800'} />
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
                     <div className="h-full glass rounded-[4rem] border border-dashed border-white/5 flex flex-col items-center justify-center p-24 text-center space-y-8 min-h-[600px] relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full"></div>
                        <div className="p-8 glass rounded-[2.5rem] border border-white/5 text-zinc-800 animate-pulse-soft">
                            <Terminal size={80} strokeWidth={1} />
                        </div>
                        <div>
                            <p className="font-black text-main text-3xl uppercase tracking-tighter">Authorized Access</p>
                            <p className="text-dim font-bold uppercase tracking-[0.3em] mt-3 opacity-60 text-[10px]">Awaiting Uplink Sequence Initiation</p>
                        </div>
                        <div className="flex gap-4">
                            {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full bg-emerald-500/30 animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}></div>)}
                        </div>
                     </div>
                 )}
            </div>
        </motion.div>
    );
};

export default ExecutionView;
