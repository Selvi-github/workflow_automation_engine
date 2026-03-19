import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, Trash2, GripVertical, Info, Terminal, LayoutList, Code2, ArrowLeft, ChevronRight, Zap } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

const SortableRow = ({ rule, onDelete, onUpdate, allPossibleSteps, inputFields }) => {
  const [condition, setCondition] = useState(rule.condition);
  const [mode, setMode] = useState('text');
  
  const [visualParts, setVisualParts] = useState([{ logic: '', field: inputFields[0]?.name || '', operator: '==', value: '' }]);

  useEffect(() => { setCondition(rule.condition); }, [rule.condition]);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleBlurText = () => {
    if (condition !== rule.condition) {
      if (!condition.trim()) { toast.error('Condition required'); setCondition(rule.condition); return; }
      onUpdate(rule.id, { condition });
    }
  };

  const syncVisualToString = (parts) => {
      const str = parts.map((p, i) => {
          let val = p.value;
          if (isNaN(val) && val !== 'true' && val !== 'false') val = `"${val}"`;
          return `${i > 0 ? ` ${p.logic} ` : ''}${p.field} ${p.operator} ${val}`;
      }).join('');
      setCondition(str);
      onUpdate(rule.id, { condition: str });
  };

  const updateVisualPart = (index, key, val) => {
      const newParts = [...visualParts];
      newParts[index][key] = val;
      setVisualParts(newParts);
      syncVisualToString(newParts);
  };

  const addVisualPart = (logic) => {
      const newParts = [...visualParts, { logic, field: inputFields[0]?.name || '', operator: '==', value: '' }];
      setVisualParts(newParts);
      syncVisualToString(newParts);
  };

  const removeVisualPart = (index) => {
      const newParts = visualParts.filter((_, i) => i !== index);
      if (newParts.length > 0) newParts[0].logic = '';
      setVisualParts(newParts);
      syncVisualToString(newParts);
  };

  const operators = ['==', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith'];

  return (
    <motion.tr ref={setNodeRef} style={style} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group/row transition-all hover:bg-white/[0.02]">
      <td className="px-6 py-6 text-center cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="text-dim group-hover/row:text-emerald-500 transition-colors mx-auto" size={18} strokeWidth={3} />
      </td>
      <td className="px-2 py-6 text-center font-black text-dim group-hover/row:text-main transition-colors text-xl italic">{rule.priority}</td>
      <td className="px-6 py-6 min-w-[500px]">
        <div className="flex justify-end mb-3">
           <div className="input-glass !p-1 rounded-xl flex items-center gap-1 border border-white/5">
              <button onClick={() => setMode('visual')} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg flex items-center gap-2 transition-all ${mode === 'visual' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-dim hover:text-main'}`}>
                 <LayoutList size={12} /> Visual
              </button>
              <button onClick={() => setMode('text')} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg flex items-center gap-2 transition-all ${mode === 'text' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-dim hover:text-main'}`}>
                 <Code2 size={12} /> Logic
              </button>
           </div>
        </div>

        {mode === 'text' ? (
            <input className="input-glass w-full font-mono text-sm !py-3" value={condition} onChange={(e) => setCondition(e.target.value)} onBlur={handleBlurText} />
        ) : (
            <div className="space-y-3 bg-zinc-950/40 p-4 border border-white/5 rounded-2xl">
               {visualParts.map((p, i) => (
                   <div key={i} className="flex items-center gap-2">
                       {i > 0 && <span className="text-[10px] font-black uppercase text-emerald-500 w-10 text-center">{p.logic}</span>}
                       <select value={p.field} onChange={e=>updateVisualPart(i, 'field', e.target.value)} className="input-glass !py-2 text-[11px] flex-1 cursor-pointer">
                           {inputFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                       </select>
                       <select value={p.operator} onChange={e=>updateVisualPart(i, 'operator', e.target.value)} className="input-glass !py-2 text-[11px] font-mono w-28 cursor-pointer">
                           {operators.map(o => <option key={o} value={o}>{o}</option>)}
                       </select>
                       <input type="text" value={p.value} onChange={e=>updateVisualPart(i, 'value', e.target.value)} className="input-glass !py-2 text-[11px] flex-1" placeholder="Value..." />
                       {visualParts.length > 1 && (
                           <button onClick={()=>removeVisualPart(i)} className="text-zinc-600 hover:text-rose-500 transition-all p-2 hover:scale-110"><Trash2 size={16}/></button>
                       )}
                   </div>
               ))}
               <div className="flex gap-3 pt-1">
                  <button onClick={()=>addVisualPart('&&')} className="px-3 py-1.5 text-[9px] font-black bg-white/5 text-zinc-400 rounded-lg border border-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all">+ AND</button>
                  <button onClick={()=>addVisualPart('||')} className="px-3 py-1.5 text-[9px] font-black bg-white/5 text-zinc-400 rounded-lg border border-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all">+ OR</button>
               </div>
            </div>
        )}
      </td>
      <td className="px-6 py-6">
        <select className="input-glass w-full !py-3 cursor-pointer" value={rule.next_step_id || ''} onChange={(e) => onUpdate(rule.id, { next_step_id: e.target.value || null })}>
            <option value="">-- TERMINATE --</option>
            {allPossibleSteps.map(s => (
                <option key={s.id} value={s.id}>{s.name.toUpperCase()} ({s.step_type})</option>
            ))}
        </select>
      </td>
      <td className="px-6 py-6 text-right">
        <button onClick={() => onDelete(rule.id)} className="text-zinc-700 hover:text-rose-500 p-3 bg-zinc-950/20 hover:bg-rose-500/10 rounded-2xl transition-all hover:rotate-12 border border-white/5">
          <Trash2 size={20} />
        </button>
      </td>
    </motion.tr>
  );
};

const RuleEditor = () => {
    const { id: stepId } = useParams();
    const navigate = useNavigate();
    const [rules, setRules] = useState([]);
    const [step, setStep] = useState(null);
    const [allPossibleSteps, setAllPossibleSteps] = useState([]);
    const [inputFields, setInputFields] = useState([]);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => { fetchData(); }, [stepId]);

    const fetchData = async () => {
        try {
            const stepRes = await api.get(`/steps/${stepId}`);
            setStep(stepRes.data);
            const rulesRes = await api.get(`/steps/${stepId}/rules`);
            setRules(rulesRes.data);
            const wfRes = await api.get(`/workflows/${stepRes.data.workflow_id}`);
            const baseFields = wfRes.data.input_schema?.properties || [];
            setInputFields([
                ...baseFields,
                { name: 'last_step_status' },
                { name: 'webhook_status' },
                { name: 'webhook_data' }
            ]);
            const wfStepsRes = await api.get(`/workflows/${stepRes.data.workflow_id}/steps`);
            setAllPossibleSteps(wfStepsRes.data);
        } catch (err) { toast.error('Load failed'); }
    };

    const handleAddRule = async () => {
        try {
            await api.post(`/steps/${stepId}/rules`, { condition: 'last_step_status == "completed"', next_step_id: null, priority: rules.length + 1 });
            toast.success('Rule injected');
            fetchData();
        } catch (err) { toast.error('Injection failed'); }
    };

    const handleDelete = async (ruleId) => {
        try {
            await api.delete(`/rules/${ruleId}`);
            toast.success('Protocol purged');
            fetchData();
        } catch (err) { toast.error('Purge failed'); }
    };

    const handleUpdateRule = async (ruleId, updates) => {
        try {
            setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates } : r));
            await api.put(`/rules/${ruleId}`, updates);
        } catch (err) { toast.error('Sync failed'); fetchData(); }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIdx = rules.findIndex((r) => r.id === active.id);
            const newIdx = rules.findIndex((r) => r.id === over.id);
            const newRules = arrayMove(rules, oldIdx, newIdx);
            const updatedRules = newRules.map((r, i) => ({ ...r, priority: i + 1 }));
            setRules(updatedRules);
            try {
                await Promise.all(updatedRules.map(r => api.put(`/rules/${r.id}`, { priority: r.priority })));
                toast.success('Priorities re-synced');
            } catch (err) { toast.error('Sync failed'); fetchData(); }
        }
    };

    const normalRules = rules.filter(r => r.condition !== 'DEFAULT');
    const defaultRule = rules.find(r => r.condition === 'DEFAULT');

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
            <div className="flex justify-between items-center glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/3 h-full bg-emerald-500/5 blur-[100px] -z-10"></div>
                <div className="flex items-center gap-8">
                    <button onClick={() => navigate(-1)} className="p-4 glass rounded-2xl hover:bg-white/5 transition-colors border border-white/5">
                        <ArrowLeft size={24} className="text-dim hover:text-main" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-main tracking-tighter uppercase flex items-center gap-4">
                            Protocol Rules
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                        </h1>
                        <p className="text-xs text-dim mt-2 font-black tracking-[0.4em] uppercase opacity-60">Architecting branch logic for <span className="text-emerald-400">{step?.name || 'Initialization Node'}</span></p>
                    </div>
                </div>
                <button onClick={handleAddRule} className="btn-emerald flex items-center gap-3">
                    <Plus size={20} strokeWidth={3} /> Inject Logic
                </button>
            </div>

            <div className="glass-emerald p-8 rounded-[2.5rem] border border-emerald-500/10 flex gap-6 text-emerald-100/70 text-sm shadow-2xl backdrop-blur-3xl">
                <div className="p-3 glass bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="text-emerald-400" size={24} strokeWidth={3} />
                </div>
                <div className="space-y-1">
                    <p className="font-black uppercase tracking-widest text-emerald-400 text-xs mb-1">Execution Pipeline Information</p>
                    <p className="leading-relaxed opacity-80">Rules are processed sequentially by <b>Priority</b>. The first matching protocol triggers the state transition. Use <code>DEFAULT</code> as the terminal fallback for unhandled states.</p>
                </div>
            </div>

            <div className="glass rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <table className="w-full text-left">
                        <thead className="input-glass text-dim text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
                            <tr>
                                <th className="px-6 py-6 w-12 text-center">X-Axis</th>
                                <th className="px-2 py-6 w-16 text-center">Pri</th>
                                <th className="px-6 py-6">Evaluation Matrix</th>
                                <th className="px-6 py-6 w-72">Destination Protocol</th>
                                <th className="px-6 py-6 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <SortableContext items={normalRules.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                {normalRules.map((rule) => (
                                    <SortableRow key={rule.id} rule={rule} onDelete={handleDelete} onUpdate={handleUpdateRule} allPossibleSteps={allPossibleSteps} inputFields={inputFields} />
                                ))}
                            </SortableContext>
                            
                            {normalRules.length === 0 && !defaultRule && (
                                <tr><td colSpan="5" className="px-6 py-24 text-center text-zinc-700 font-bold italic bg-zinc-950/20">No active logic nodes detected in this sector.</td></tr>
                            )}
                            
                            {defaultRule && (
                                <tr className="glass bg-white/[0.03] !border-t-2 !border-white/10">
                                    <td className="px-6 py-10 text-center">
                                        <GitBranch className="text-zinc-700" size={20} />
                                    </td>
                                    <td className="px-2 py-10 text-center font-black text-emerald-500 text-2xl italic opacity-50">∞</td>
                                    <td className="px-6 py-10">
                                        <div className="flex items-center gap-6">
                                            <div className="glass shadow-[0_0_20px_rgba(16,185,129,0.1)] px-5 py-2.5 rounded-2xl border border-emerald-500/20">
                                                <span className="font-black text-main text-[10px] tracking-[0.4em] uppercase">DEFAULT FALLBACK</span>
                                            </div>
                                            <span className="text-xs text-dim font-bold uppercase tracking-widest opacity-60">Terminal execution path if all prior matrices fail</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-10">
                                        <select className="input-glass w-full !py-3 cursor-pointer shadow-2xl" value={defaultRule.next_step_id || ''} onChange={(e) => handleUpdateRule(defaultRule.id, { next_step_id: e.target.value || null })}>
                                            <option value="">-- TERMINATE SESSION --</option>
                                            {allPossibleSteps.map(s => (
                                                <option key={s.id} value={s.id}>{s.name.toUpperCase()} ({s.step_type})</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-10 text-right"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </DndContext>
            </div>
        </div>
    );
};

export default RuleEditor;
