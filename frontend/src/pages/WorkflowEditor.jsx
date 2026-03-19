import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, FileCode, X, Globe, User, Bell, Cpu, ArrowRight } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Component Imports
import SchemaBuilder from '../components/workflow/SchemaBuilder';
import StepManager from '../components/workflow/StepManager';
import FlowVisualizer from '../components/workflow/FlowVisualizer';

const WorkflowEditor = () => {
    const { id } = useParams();
    const isNew = id === 'new';
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!isNew);
    
    const [workflow, setWorkflow] = useState({ name: '', start_step_id: '', is_active: true });
    const [fields, setFields] = useState([]);
    const [steps, setSteps] = useState([]);
    const [editingStep, setEditingStep] = useState(null);

    useEffect(() => { if (!isNew) fetchWorkflow(); }, [id]);

    const fetchWorkflow = async () => {
        if (!id || id === 'undefined') return;
        try {
            const res = await api.get(`/workflows/${id}`);
            const wfData = res.data;
            setWorkflow({ name: wfData.name, start_step_id: wfData.start_step_id || '', is_active: wfData.is_active });
            if (wfData.input_schema && wfData.input_schema.properties) {
                setFields(wfData.input_schema.properties.map((p, i) => ({
                    id: `field-${Date.now()}-${i}`,
                    name: p.name || '',
                    type: p.type || 'string',
                    required: !!p.required,
                    allowed_values: p.allowed_values || null
                })));
            }
            setSteps(wfData.steps || []);
        } catch (err) { 
            toast.error('Failed to synchronize grid'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSaveWorkflow = async () => {
        if (!workflow.name) return toast.error('Protocol Alias required');
        const inputSchema = { properties: fields.map(f => ({ name: f.name, type: f.type, required: f.required, allowed_values: f.allowed_values })) };
        const payload = { ...workflow, input_schema: inputSchema };
        try {
            if (isNew) {
                const res = await api.post('/workflows', payload);
                toast.success('Protocol Initialized');
                navigate(`/workflow/${res.data.id}`);
            } else {
                await api.put(`/workflows/${id}`, payload);
                toast.success('Grid Synchronized');
            }
        } catch (err) { 
            toast.error('Synchronization failed'); 
        }
    };

    const handleAddStep = async () => {
        const name = prompt('Register node name:');
        if (!name) return;
        try {
            await api.post(`/workflows/${id}/steps`, { name, step_type: 'task', step_order: steps.length + 1, metadata: {} });
            fetchWorkflow();
        } catch (err) { 
            toast.error('Node registration failed'); 
        }
    };

    const handleSaveStepConfig = async () => {
        try {
            await api.put(`/steps/${editingStep.id}`, editingStep);
            toast.success('Node parameters updated');
            setEditingStep(null);
            fetchWorkflow();
        } catch (err) { 
            toast.error('Configuration update failed'); 
        }
    };

    if (loading) return (
        <div className="max-w-7xl mx-auto space-y-16 animate-pulse pt-10">
            <div className="h-44 glass rounded-[4rem]" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="h-[500px] glass rounded-[4rem]" />
                <div className="h-[500px] glass rounded-[4rem]" />
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-16 pb-32 relative">
            {/* Super Senior Header Node */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-14 glass rounded-[4rem] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-hidden group mesh-gradient">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent"></div>
                
                <div className="relative z-10 flex items-center gap-10">
                    <div className="p-8 glass-emerald rounded-[3rem] shadow-[0_20px_50px_rgba(16,185,129,0.25)] border border-emerald-500/40">
                        <FileCode size={48} strokeWidth={2.5} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-main tracking-tighter uppercase mb-2">{isNew ? 'Protocol Initialization' : 'Architecture Node'}</h1>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]"></div>
                            <p className="text-[12px] font-black text-dim tracking-[0.4em] uppercase opacity-60 italic">Core Processing Grid</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 lg:mt-0 flex gap-6 z-10 w-full lg:w-auto">
                    <button onClick={handleSaveWorkflow} className="btn-emerald group/save flex-1 lg:flex-none">
                        <Save size={24} strokeWidth={3} className="group-hover/save:scale-110 transition-transform" />
                        <span className="uppercase tracking-[0.2em] font-black">Sync Grid Node</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Meta Config */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-12">
                     <div className="glass p-12 rounded-[3.5rem] border border-white/5 space-y-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <Cpu className="text-emerald-500" size={28} />
                            <h2 className="text-2xl font-black text-main tracking-tight uppercase">Base Parameters</h2>
                        </div>
                        
                        <div className="space-y-8 relative z-10">
                            <div>
                                <label className="block text-[11px] font-black text-dim uppercase tracking-[0.3em] mb-4 opacity-70">Protocol Alias</label>
                                <input type="text" className="input-glass w-full !bg-zinc-950/40 !rounded-[1.5rem]" value={workflow.name} onChange={e => setWorkflow({...workflow, name: e.target.value})} placeholder="e.g. CORE_LOGISTICS_X1" />
                            </div>
                            
                            <div 
                                onClick={() => setWorkflow({...workflow, is_active: !workflow.is_active})}
                                className={`flex items-center justify-between p-8 rounded-[2rem] border cursor-pointer transition-all duration-700 shadow-xl ${workflow.is_active ? 'glass-emerald border-emerald-500/40 shadow-[0_15px_40px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10 opacity-60'}`}
                            >
                                <div>
                                    <span className="text-xs font-black text-main uppercase tracking-[0.2em] block mb-2">Node Status</span>
                                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest italic">{workflow.is_active ? 'Online & Syncing' : 'System Hibernation'}</span>
                                </div>
                                <div className={`w-14 h-8 rounded-full relative transition-all duration-700 p-1 ${workflow.is_active ? 'bg-emerald-500/30' : 'bg-zinc-900'}`}>
                                    <div className={`w-6 h-6 rounded-full transition-all duration-700 shadow-2xl ${workflow.is_active ? 'translate-x-6 bg-emerald-400' : 'translate-x-0 bg-zinc-700'}`}></div>
                                </div>
                            </div>
                        </div>
                     </div>

                     <SchemaBuilder fields={fields} setFields={setFields} />
                </div>

                {/* Node Management */}
                <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-12">
                     {!isNew && (
                        <>
                            <StepManager steps={steps} handleAddStep={handleAddStep} setEditingStep={setEditingStep} workflowId={id} />
                            <FlowVisualizer steps={steps} startStepId={workflow.start_step_id} />
                        </>
                     )}
                     
                     {isNew && (
                         <div className="h-full glass rounded-[4rem] border border-zinc-900 flex flex-col items-center justify-center p-20 mesh-gradient">
                             <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mb-10 animate-step">
                                 <Cpu size={48} className="text-emerald-500/50" />
                             </div>
                             <h2 className="text-3xl font-black text-zinc-800 uppercase tracking-[0.4em]">Node Staging Area</h2>
                             <p className="text-xs font-bold text-zinc-900 mt-4 uppercase tracking-[0.2em] max-w-sm text-center line-clamp-2">Synchronize base parameters to initialize the processing grid architecture.</p>
                         </div>
                     )}
                </div>
            </div>

            {/* Premium Step Config Modal */}
            <AnimatePresence>
                {editingStep && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="glass max-w-3xl w-full rounded-[4rem] border border-white/10 p-16 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.8)]"></div>
                            <button onClick={() => setEditingStep(null)} className="absolute top-12 right-12 text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-500 hover:scale-125"><X size={32} /></button>
                            
                            <div className="mb-14">
                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Node Parameters</h2>
                                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.5em] opacity-60">System Configuration Interface</p>
                            </div>
                            
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Node Alias</label>
                                        <input type="text" className="input-glass w-full !bg-zinc-950/60 !rounded-[1.5rem]" value={editingStep.name} onChange={e => setEditingStep({...editingStep, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Execution Protocol</label>
                                        <select className="input-glass w-full !bg-zinc-950/60 !rounded-[1.5rem] cursor-pointer" value={editingStep.step_type} onChange={e => setEditingStep({...editingStep, step_type: e.target.value, metadata: {}})}>
                                            <option value="task">Modular Logic Task</option>
                                            <option value="approval">Human Validation Node</option>
                                            <option value="notification">Broadcast Pulse</option>
                                            <option value="webhook">External Proxy (Webhook)</option>
                                        </select>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {editingStep.step_type === 'webhook' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-8 bg-indigo-500/5">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 bg-indigo-500/10 rounded-xl"><Globe size={24} className="text-indigo-400" /></div>
                                                <span className="text-sm font-black text-white uppercase tracking-[0.2em]">External Proxy Configuration</span>
                                            </div>
                                            <div className="grid grid-cols-12 gap-6">
                                                <div className="col-span-12 md:col-span-4">
                                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-2">Method</label>
                                                    <select className="input-glass w-full !bg-zinc-950/60" value={editingStep.metadata.method || 'POST'} onChange={e => setEditingStep({...editingStep, metadata: {...editingStep.metadata, method: e.target.value}})}>
                                                        <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-12 md:col-span-8">
                                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-2">Target Interface URL</label>
                                                    <input type="text" className="input-glass w-full font-mono text-xs !bg-zinc-950/60" value={editingStep.metadata.url || ''} onChange={e => setEditingStep({...editingStep, metadata: {...editingStep.metadata, url: e.target.value}})} placeholder="https://api.v4.node/sync/..." />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-2">Header Map (JSON)</label>
                                                <textarea className="input-glass w-full h-32 font-mono text-[11px] resize-none !bg-zinc-950/60 !rounded-[2rem]" value={editingStep.metadata.headers ? JSON.stringify(editingStep.metadata.headers, null, 2) : ''} onChange={e => { try { const h = JSON.parse(e.target.value); setEditingStep({...editingStep, metadata: {...editingStep.metadata, headers: h}}); } catch(err){}}} placeholder='{ "X-Grid-Token": "v4_secure_..." }' />
                                            </div>
                                        </motion.div>
                                    )}

                                    {editingStep.step_type === 'notification' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-8 bg-amber-500/5">
                                             <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 bg-amber-500/10 rounded-xl"><Bell size={24} className="text-amber-400" /></div>
                                                <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Broadcast Pulse configuration</span>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-2">Recipient Pulse Address (Email)</label>
                                                <input type="text" className="input-glass w-full !bg-zinc-950/60 !rounded-[1.5rem]" value={editingStep.metadata.notification_email || ''} onChange={e => setEditingStep({...editingStep, metadata: {...editingStep.metadata, notification_email: e.target.value}})} placeholder="ops-center@grid.com" />
                                            </div>
                                        </motion.div>
                                    )}

                                    {editingStep.step_type === 'approval' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-8 bg-emerald-500/5">
                                             <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 bg-emerald-500/10 rounded-xl"><User size={24} className="text-emerald-400" /></div>
                                                <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Human Validation Threshold</span>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-2">Security Clearance Required (Role)</label>
                                                <select className="input-glass w-full !bg-zinc-950/60 !rounded-[1.5rem]" value={editingStep.metadata.required_role || 'manager'} onChange={e => setEditingStep({...editingStep, metadata: {...editingStep.metadata, required_role: e.target.value}})}>
                                                    <option value="manager">Lead Architect (Manager)</option>
                                                    <option value="ceo">Chief Executor (CEO)</option>
                                                    <option value="admin">Grid Superuser (Admin)</option>
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex flex-col md:flex-row gap-6 pt-10">
                                    <button onClick={handleSaveStepConfig} className="btn-emerald flex-1 shadow-[0_20px_40px_rgba(16,185,129,0.3)]">
                                        <Save size={20} strokeWidth={3} /> Synchronize Node Matrix
                                    </button>
                                    <button onClick={() => setEditingStep(null)} className="glass px-10 py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white hover:bg-zinc-900 border-white/10 transition-all active:scale-95">Abort Protocol</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkflowEditor;
