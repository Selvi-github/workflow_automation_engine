import React from 'react';
import { Cpu, Plus, Edit3, Trash2, Settings, User, Bell, Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StepManager = ({ steps, handleAddStep, setEditingStep, workflowId }) => {
    const navigate = useNavigate();

    const getTypeColor = (type) => {
        if (type === 'approval') return 'emerald';
        if (type === 'notification') return 'amber';
        if (type === 'webhook') return 'indigo';
        return 'zinc';
    };

    const getTypeIcon = (type) => {
        if (type === 'approval') return <User size={18} />;
        if (type === 'notification') return <Bell size={18} />;
        if (type === 'webhook') return <Globe size={18} />;
        return <Cpu size={18} />;
    };

    return (
        <div className="glass p-12 rounded-[3.5rem] border border-white/5 space-y-12">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-4 glass-emerald rounded-[1.5rem] shadow-xl">
                        <Cpu className="text-emerald-400" size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-main tracking-tighter uppercase">Processor Nodes</h2>
                        <p className="text-[10px] font-black text-dim tracking-[0.4em] uppercase opacity-50 mt-1">Logic Execution Layer</p>
                    </div>
                </div>
                <button onClick={handleAddStep} className="btn-emerald !bg-zinc-900 hover:!bg-emerald-600 !py-3 !px-6 !rounded-2xl group/btn">
                    <Plus size={20} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                    <span className="uppercase tracking-widest text-[11px] font-black">Register Node</span>
                </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {steps.map((step, idx) => (
                    <div key={step.id} className="glass border border-white/5 hover:border-emerald-500/30 p-8 rounded-[2.5rem] flex items-center justify-between group transition-all duration-700 cursor-pointer overflow-hidden relative active:scale-95 shadow-lg">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-950/60 text-emerald-500 flex items-center justify-center font-black text-sm border border-white/5 group-hover:border-emerald-500/50 transition-all duration-500 shadow-inner">
                                {idx + 1}
                            </div>
                            <div>
                                <div className="font-black text-lg text-main uppercase tracking-tight group-hover:text-emerald-400 transition-colors underline-offset-4 group-hover:underline">{step.name}</div>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-${getTypeColor(step.step_type)}-500/10 text-${getTypeColor(step.step_type)}-400 border border-${getTypeColor(step.step_type)}-500/10`}>
                                        {step.step_type}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Protocol {idx + 1}.0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 relative z-10">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/rules/${step.id}`); }} className="glass text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] px-6 py-3 rounded-2xl transition-all hover:bg-emerald-500 hover:text-white border-emerald-500/20 active:scale-90 hover:shadow-xl hover:shadow-emerald-500/20">Rules</button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingStep(JSON.parse(JSON.stringify(step))); }} className="glass text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] px-6 py-3 rounded-2xl transition-all hover:bg-zinc-800 hover:text-white border-white/5 active:scale-90">Config</button>
                        </div>
                    </div>
                ))}

                {steps.length === 0 && (
                    <div className="py-24 text-center glass rounded-[3rem] border-2 border-dashed border-white/5 font-black text-zinc-800 text-sm uppercase tracking-[0.5em] mesh-gradient">
                        No processing nodes registered
                    </div>
                )}
            </div>
        </div>
    );
};

export default StepManager;
