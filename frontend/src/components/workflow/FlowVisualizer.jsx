import React from 'react';
import { Cpu, User, Bell, Globe, ArrowRight, PlayCircle } from 'lucide-react';

const FlowVisualizer = ({ steps, startStepId }) => {
    const getTypeColor = (type) => {
        if (type === 'approval') return 'emerald';
        if (type === 'notification') return 'amber';
        if (type === 'webhook') return 'indigo';
        return 'zinc';
    };

    const getTypeIcon = (type) => {
        if (type === 'approval') return <User size={20} />;
        if (type === 'notification') return <Bell size={20} />;
        if (type === 'webhook') return <Globe size={20} />;
        return <Cpu size={20} />;
    };

    return (
        <div className="w-full h-full glass rounded-[4rem] overflow-auto p-16 relative min-h-[700px] border border-white/5 mesh-gradient scrollbar-hide shadow-inner">
           <div className="flex items-center justify-between mb-16 relative z-10">
               <div className="flex flex-col gap-2">
                    <h3 className="font-black text-main text-2xl uppercase tracking-[0.4em] flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse"></div>
                        Architecture View
                    </h3>
                    <p className="text-[10px] font-black text-dim tracking-[0.3em] uppercase opacity-40 ml-7">System Logic Flowchart</p>
               </div>
               <div className="flex gap-6 p-4 glass rounded-3xl border border-white/5 shadow-2xl">
                  {['approval', 'notification', 'webhook', 'task'].map(t => (
                      <div key={t} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-500 cursor-help">
                          <div className={`w-2 h-2 rounded-full bg-${getTypeColor(t)}-500 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}></div>
                          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400">{t}</span>
                      </div>
                  ))}
               </div>
           </div>
           
           <div className="relative mx-auto w-max flex flex-col items-center gap-y-24 pb-24 z-10">
               <div className="w-20 h-20 glass-emerald rounded-[2rem] flex items-center justify-center ring-[12px] ring-[var(--background)] shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-pulse-soft border-2 border-emerald-500/40 relative">
                  <PlayCircle size={40} className="text-emerald-400" strokeWidth={2.5} />
                  <div className="absolute -bottom-16 w-[2px] h-12 bg-gradient-to-b from-emerald-500/50 to-transparent"></div>
               </div>
               
               <div className="flex flex-wrap justify-center gap-20">
                   {steps.map((step, idx) => (
                      <div key={step.id} className="relative group flex flex-col items-center gap-8 w-80">
                          <div className={`glass border border-${getTypeColor(step.step_type)}-500/30 w-full p-8 rounded-[3rem] shadow-2xl relative transition-all duration-700 hover:scale-110 hover:border-emerald-500/60 z-10 group-hover:-translate-y-2`}>
                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]"></div>
                              <div className={`flex items-center gap-4 font-black text-main mb-3 relative z-10`}>
                                  <div className={`p-3 rounded-2xl bg-zinc-950/60 text-${getTypeColor(step.step_type)}-400 shadow-inner border border-white/5`}>
                                      {getTypeIcon(step.step_type)}
                                  </div>
                                  <span className="text-base tracking-tighter uppercase group-hover:text-emerald-400 transition-colors">{step.name}</span>
                              </div>
                              <div className="flex items-center gap-2 ml-14 relative z-10">
                                  <div className={`w-1.5 h-1.5 rounded-full bg-${getTypeColor(step.step_type)}-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]`}></div>
                                  <div className="text-[11px] uppercase font-black text-zinc-600 tracking-[0.4em] italic">{step.step_type}</div>
                              </div>
                          </div>

                          <div className="flex flex-col gap-4 w-full px-6 relative z-10">
                              {(step.rules || []).map((rule, rIdx) => {
                                  const isTerm = !rule.next_step_id;
                                  const nextName = isTerm ? 'FINALIZE' : (steps.find(s=>s.id === rule.next_step_id)?.name || 'NEXT NODE');
                                  return (
                                      <div key={rIdx} className="glass border border-white/10 hover:border-emerald-500/40 p-4 rounded-[1.5rem] flex justify-between items-center transition-all duration-500 group/rule hover:shadow-2xl hover:bg-zinc-950/40">
                                          <div className="flex flex-col gap-1 overflow-hidden">
                                              <span className="font-mono text-[10px] text-zinc-600 group-hover/rule:text-zinc-400 transition-colors truncate max-w-[140px]" title={rule.condition}>{rule.condition}</span>
                                              <div className="text-[9px] font-black text-zinc-700 group-hover/rule:text-emerald-500/50 uppercase tracking-widest">Logic Rule {rIdx + 1}</div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                              <ArrowRight size={18} className="text-zinc-700 group-hover/rule:text-emerald-400 transition-all duration-500 group-hover/rule:translate-x-1" />
                                              <span className={`font-black text-[10px] uppercase tracking-tighter ${isTerm ? 'text-rose-500/90 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'text-emerald-400 group-hover/rule:text-emerald-300 transition-colors'}`}>{nextName}</span>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                          
                          {/* Visual Connector Line */}
                          <div className="absolute -z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                      </div>
                   ))}
               </div>
           </div>
        </div>
    );
};

export default FlowVisualizer;
