import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowRight, Settings, FileCode, List, GripVertical, PlayCircle, User, Bell, Cpu, Globe, X } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

const SortableField = ({ field, index, updateField, removeField }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="flex flex-col md:flex-row gap-4 items-start md:items-center glass-card !p-5 group mb-4">
            <div className="cursor-grab text-zinc-700 group-hover:text-emerald-500/50 hidden md:block transition-colors" {...attributes} {...listeners}>
                <GripVertical size={20} />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                <div>
                    <label className="text-[10px] font-black text-dim uppercase tracking-[0.2em] block mb-2">Field Name</label>
                    <input type="text" value={field.name} onChange={e => updateField(field.id, 'name', e.target.value)} className="input-glass w-full" placeholder="e.g. amount" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-2">Type</label>
                    <select value={field.type} onChange={e => updateField(field.id, 'type', e.target.value)} className="input-glass w-full cursor-pointer">
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-2">Allowed Values</label>
                    <input type="text" value={field.allowed_values ? field.allowed_values.join(', ') : ''} onChange={e => updateField(field.id, 'allowed_values', e.target.value ? e.target.value.split(',').map(v => v.trim()) : null)} className="input-glass w-full font-mono text-[10px]" placeholder="Comma separated..." />
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer mt-7 group/check">
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${field.required ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'border-white/10'}`}>
                            {field.required && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <input type="checkbox" className="hidden" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} />
                        <span className="text-xs font-bold text-zinc-400 group-hover/check:text-zinc-200 uppercase tracking-widest">Required</span>
                    </label>
                </div>
            </div>
            <button onClick={() => removeField(field.id)} className="text-zinc-600 hover:text-red-500 p-2 mt-4 md:mt-1 transition-all hover:scale-110 active:scale-90">
                <Trash2 size={18} />
            </button>
        </div>
    );
};

const FlowDiagram = ({ steps, startStepId }) => {
    const getTypeColor = (type) => {
        if (type === 'approval') return 'emerald';
        if (type === 'notification') return 'amber';
        if (type === 'webhook') return 'indigo';
        return 'zinc';
    };

    const getTypeIcon = (type) => {
        if (type === 'approval') return <User size={16} />;
        if (type === 'notification') return <Bell size={16} />;
        if (type === 'webhook') return <Globe size={16} />;
        return <Cpu size={16} />;
    };

    return (
        <div className="w-full mt-6 glass rounded-3xl overflow-auto p-12 relative min-h-[500px] border border-white/5">
           <div className="flex items-center justify-between mb-10">
               <h3 className="font-black text-main text-lg uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    Engine Architecture
               </h3>
               <div className="flex gap-4">
                  {['approval', 'notification', 'webhook', 'task'].map(t => (
                      <div key={t} className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                          <div className={`w-2 h-2 rounded-full bg-${getTypeColor(t)}-500`}></div>
                          <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">{t}</span>
                      </div>
                  ))}
               </div>
           </div>
           
           <div className="relative mx-auto w-max flex flex-col items-center gap-y-16 pb-16">
               <div className="w-16 h-16 glass-emerald rounded-full flex items-center justify-center ring-8 ring-[var(--background)] shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-pulse-soft">
                  <PlayCircle size={32} className="text-emerald-500" />
               </div>
               
               <div className="flex flex-wrap justify-center gap-16">
                   {steps.map((step, idx) => (
                      <div key={step.id} className="relative group flex flex-col items-center gap-6 w-72">
                          <div className={`glass border border-${getTypeColor(step.step_type)}-500/20 w-full p-6 rounded-[2rem] shadow-2xl relative transition-all duration-500 hover:scale-105 hover:border-emerald-500/40 z-10`}>
                              <div className={`flex items-center gap-3 font-bold text-main mb-2`}>
                                  <div className={`p-2 rounded-xl bg-white/5 text-${getTypeColor(step.step_type)}-400`}>
                                      {getTypeIcon(step.step_type)}
                                  </div>
                                  <span className="text-sm tracking-tight uppercase">{step.name}</span>
                              </div>
                              <div className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.3em] ml-11">{step.step_type}</div>
                          </div>

                          <div className="flex flex-col gap-3 w-full px-4">
                              {(step.rules || []).map((rule, rIdx) => {
                                  const isTerm = !rule.next_step_id;
                                  const nextName = isTerm ? 'TERMINATE' : (steps.find(s=>s.id === rule.next_step_id)?.name || 'Next');
                                  return (
                                      <div key={rIdx} className="glass border border-white/5 hover:border-white/10 p-3 rounded-2xl flex justify-between items-center transition-all group/rule">
                                          <span className="font-mono text-[9px] text-zinc-500 truncate max-w-[120px]" title={rule.condition}>{rule.condition}</span>
                                          <ArrowRight size={14} className="text-emerald-500/30 group-hover/rule:text-emerald-500 transition-colors" />
                                          <span className={`font-black text-[9px] uppercase tracking-tighter ${isTerm ? 'text-rose-500/70' : 'text-emerald-400'}`}>{nextName}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                   ))}
               </div>
           </div>
        </div>
    );
};

const WorkflowEditor = () => {
    const { id } = useParams();
    const isNew = id === 'new';
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!isNew);
    
    const [workflow, setWorkflow] = useState({ name: '', start_step_id: '', is_active: true });
    const [fields, setFields] = useState([]);
    const [steps, setSteps] = useState([]);
    const [editingStep, setEditingStep] = useState(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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
        } catch (err) { toast.error('Failed to load'); } finally { setLoading(false); }
    };

    const handleSaveWorkflow = async () => {
        if (!workflow.name) return toast.error('Name required');
        const inputSchema = { properties: fields.map(f => ({ name: f.name, type: f.type, required: f.required, allowed_values: f.allowed_values })) };
        const payload = { ...workflow, input_schema: inputSchema };
        try {
            if (isNew) {
                const res = await api.post('/workflows', payload);
                toast.success('Workflow created');
                navigate(`/workflow/${res.data.id}`);
            } else {
                await api.put(`/workflows/${id}`, payload);
                toast.success('Configuration synchronized');
            }
        } catch (err) { toast.error('Save failed'); }
    };

    const handleAddStep = async () => {
        const name = prompt('Step name:');
        if (!name) return;
        try {
            await api.post(`/workflows/${id}/steps`, { name, step_type: 'task', step_order: steps.length + 1, metadata: {} });
            fetchWorkflow();
        } catch (err) { toast.error('Failed to add step'); }
    };

    const handleSaveStepConfig = async () => {
        try {
            await api.put(`/steps/${editingStep.id}`, editingStep);
            toast.success('Step architecture updated');
            setEditingStep(null);
            fetchWorkflow();
        } catch (err) { toast.error('Update failed'); }
    };

    const handleAddField = () => setFields([...fields, { id: `field-${Date.now()}`, name: '', type: 'string', required: false, allowed_values: null }]);
    const updateField = (fId, key, value) => setFields(fields.map(f => f.id === fId ? { ...f, [key]: value } : f));
    const removeField = (fId) => setFields(fields.filter(f => f.id !== fId));
    const handleDragEndFields = (e) => {
        if (e.active.id !== e.over.id) {
            const oldIdx = fields.findIndex(f => f.id === e.active.id);
            const newIdx = fields.findIndex(f => f.id === e.over.id);
            setFields(arrayMove(fields, oldIdx, newIdx));
        }
    };

    if (loading) return <div className="max-w-6xl mx-auto space-y-12 animate-pulse pt-10"><div className="h-40 glass rounded-[3rem]" /><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="h-80 glass rounded-[3rem]" /><div className="md:col-span-2 h-80 glass rounded-[3rem]" /></div></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 relative overflow-visible">
            {/* Header */}
            <div className="flex justify-between items-center glass p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="p-4 glass-emerald rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <FileCode size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-main tracking-tighter uppercase">{isNew ? 'Initialize Protocol' : 'Sync Architecture'}</h1>
                        <p className="text-sm text-dim mt-1 font-bold tracking-widest uppercase opacity-60">System Configuration Node</p>
                    </div>
                </div>
                <button onClick={handleSaveWorkflow} className="btn-emerald flex items-center gap-3">
                    <Save size={20} strokeWidth={2.5} /> Synchronize Grid
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* General Settings */}
                <div className="lg:col-span-4 glass p-10 rounded-[3rem] space-y-8 h-fit border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Settings className="text-emerald-500" size={24} />
                        <h2 className="text-xl font-black text-main tracking-tight uppercase">Base Settings</h2>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-dim uppercase tracking-[0.3em] mb-3">Workflow Alias</label>
                        <input type="text" className="input-glass w-full" value={workflow.name} onChange={e => setWorkflow({...workflow, name: e.target.value})} placeholder="e.g. Employee Onboarding" />
                    </div>
                    <div 
                        onClick={() => setWorkflow({...workflow, is_active: !workflow.is_active})}
                        className={`flex items-center justify-between p-6 rounded-[2rem] border cursor-pointer transition-all duration-300 ${workflow.is_active ? 'glass-emerald border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'input-glass opacity-50'}`}
                    >
                        <div>
                            <span className="text-xs font-black text-main uppercase tracking-wider block mb-1">Live Status</span>
                            <span className="text-[10px] font-bold text-dim italic">Deploy to live environment</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${workflow.is_active ? 'bg-emerald-500/40' : 'bg-zinc-800'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${workflow.is_active ? 'left-7 bg-emerald-400' : 'left-1 bg-zinc-600'}`}></div>
                        </div>
                    </div>
                </div>

                {/* Schema Builder */}
                <div className="lg:col-span-8 glass p-10 rounded-[3rem] space-y-10 border border-white/5 relative">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <List className="text-emerald-500" size={24} />
                            <h2 className="text-xl font-black text-main tracking-tight uppercase">Payload Schema</h2>
                        </div>
                        <button onClick={handleAddField} className="bg-white/5 hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-400 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2">
                            <Plus size={16} strokeWidth={3} /> Inject Field
                        </button>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFields}>
                        <SortableContext items={fields.map(f=>f.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {fields.length === 0 ? (
                                    <div className="py-20 text-center text-zinc-700 bg-zinc-950/20 border-2 border-dashed border-white/5 rounded-[2.5rem] font-bold text-sm">No payload defined for this architecture.</div>
                                ) : (
                                    fields.map((field, index) => (
                                        <SortableField key={field.id} field={field} index={index} updateField={updateField} removeField={removeField} />
                                    ))
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* Steps Management */}
            {!isNew && (
                <div className="glass rounded-[4rem] border border-white/5 p-12 mt-12 shadow-2xl overflow-visible">
                    <div className="flex justify-between items-center mb-12">
                        <div className="flex items-center gap-4">
                            <Cpu className="text-emerald-500" size={32} strokeWidth={2.5} />
                            <div>
                                <h2 className="text-3xl font-black text-main tracking-tighter uppercase">Processor Logic</h2>
                                <p className="text-[10px] font-bold text-dim uppercase tracking-[0.4em] mt-1 opacity-50">State Machine Management</p>
                            </div>
                        </div>
                        <button onClick={handleAddStep} className="btn-emerald flex items-center gap-3 !bg-zinc-800 hover:!bg-emerald-600">
                            <Plus size={20} strokeWidth={3} /> Register Step
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-4 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {steps.map((step, idx) => (
                                <div key={step.id} className="glass border border-white/5 hover:border-emerald-500/30 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 cursor-pointer overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-10 h-10 rounded-2xl bg-zinc-950/60 text-emerald-500 flex items-center justify-center font-black text-xs border border-white/5 group-hover:border-emerald-500/50 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-black text-sm text-main uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{step.name}</div>
                                            <div className="text-[9px] text-dim font-bold tracking-[0.2em] uppercase mt-1 opacity-60 italic">{step.step_type}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 relative z-10">
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/rules/${step.id}`); }} className="glass text-emerald-400 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:bg-emerald-500 hover:text-white border-emerald-500/20 active:scale-95">Rules</button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingStep(JSON.parse(JSON.stringify(step))); }} className="glass text-zinc-400 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:bg-zinc-700 hover:text-white border-white/5 active:scale-95">Config</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="lg:col-span-8">
                           <FlowDiagram steps={steps} startStepId={workflow.start_step_id} />
                        </div>
                    </div>
                </div>
            )}

            {/* Editing Step Modal */}
            <AnimatePresence>
                {editingStep && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass max-w-2xl w-full rounded-[3.5rem] border border-white/10 p-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                            <button onClick={() => setEditingStep(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
                            
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Step Configuration</h2>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-10 opacity-60">Protocols & Parameters</p>
                            
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Step Alias</label>
                                        <input type="text" className="input-glass w-full" value={editingStep.name} onChange={e => setEditingStep({...editingStep, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Operation Type</label>
                                        <select className="input-glass w-full" value={editingStep.step_type} onChange={e => setEditingStep({...editingStep, step_type: e.target.value, metadata: {}})}>
                                            <option value="task">Modular Task</option>
                                            <option value="approval">Human Approval</option>
                                            <option value="notification">Broadcast Alert</option>
                                            <option value="webhook">External Webhook</option>
                                        </select>
                                    </div>
                                </div>

                                {editingStep.step_type === 'webhook' && (
                                    <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Globe size={18} className="text-indigo-400" />
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Connect external API</span>
                                        </div>
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-3">
                                                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Method</label>
                                                <select className="input-glass w-full" value={editingStep.metadata.method || 'POST'} onChange={e => setEditingStep({...editingStep, metadata: {...editingStep.metadata, method: e.target.value}})}>
                                                    <option>GET</option>
                                                    <option>POST</option>
                                                    <option>PUT</option>
                                                    <option>DELETE</option>
                                                </select>
                                            </div>
                                            <div className="col-span-9">
                                                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Target Endpoint URL</label>
                                                <input type="text" className="input-glass w-full font-mono text-xs" value={editingStep.metadata.url || ''} onChange={e => setEditingStep({...editingStep, metadata: {...editingStep.metadata, url: e.target.value}})} placeholder="https://api.example.com/hooks/..." />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Header Configuration (JSON)</label>
                                            <textarea className="input-glass w-full h-24 font-mono text-[10px] resize-none" value={editingStep.metadata.headers ? JSON.stringify(editingStep.metadata.headers, null, 2) : ''} onChange={e => { try { const h = JSON.parse(e.target.value); setEditingStep({...editingStep, metadata: {...editingStep.metadata, headers: h}}); } catch(err){}}} placeholder='{"Authorization": "Bearer key_..."}' />
                                        </div>
                                    </div>
                                )}

                                {editingStep.step_type === 'notification' && (
                                    <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Recipient Email Address</label>
                                            <input type="text" className="input-glass w-full" value={editingStep.metadata.notification_email || ''} onChange={e => setEditingStep({...editingStep, metadata: {...editingStep.metadata, notification_email: e.target.value}})} placeholder="finance@company.com" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-6">
                                    <button onClick={handleSaveStepConfig} className="btn-emerald flex-1">Apply Protocol Change</button>
                                    <button onClick={() => setEditingStep(null)} className="glass px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Abort</button>
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
