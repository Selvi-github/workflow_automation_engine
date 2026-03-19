import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Edit3, Trash2, Search, ArrowRight, Activity, Cpu, Layers, Copy } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const WorkflowList = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await api.get('/workflows');
      setWorkflows(res.data);
    } catch (err) {
      toast.error('Failed to synchronize grid');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Terminate this workflow protocol?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      toast.success('Protocol terminated');
      fetchWorkflows();
    } catch (err) {
      toast.error('Termination failed');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const loadingToast = toast.loading('Cloning protocol...');
      const res = await api.get(`/workflows/${id}`);
      const wf = res.data;
      
      const newWfRes = await api.post('/workflows', {
        name: `${wf.name} (Clone)`,
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
      toast.success('Protocol cloned successfully');
      fetchWorkflows();
    } catch (err) {
      toast.error('Cloning failed');
    }
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-12 pt-10 px-4">
        <div className="h-44 glass animate-pulse rounded-[3.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map(i => <div key={i} className="h-96 glass animate-pulse rounded-[3.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-32 px-4 max-w-7xl mx-auto">
      {/* Dynamic Header Node */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-14 glass rounded-[4rem] border border-white/5 relative overflow-hidden group mesh-gradient">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>
        
        <div className="relative z-10 flex items-center gap-10">
            <div className="p-7 glass-emerald rounded-[3rem] shadow-[0_20px_50px_rgba(16,185,129,0.2)] border border-emerald-500/30">
                <Cpu size={48} strokeWidth={2.5} className="animate-pulse-soft text-emerald-400" />
            </div>
            <div>
                <h1 className="text-5xl font-black text-main tracking-tighter uppercase mb-3">System Registry</h1>
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                    <p className="text-sm font-black text-dim tracking-[0.4em] uppercase opacity-60">Active Protocol Matrix v4.2.0</p>
                </div>
            </div>
        </div>

        <div className="mt-12 lg:mt-0 flex flex-col md:flex-row gap-6 w-full lg:w-auto z-10">
          <div className="relative w-full md:w-96 group/search">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/search:text-emerald-500 transition-colors duration-300" size={22} />
            <input 
              type="text" 
              placeholder="Search Protocols..." 
              className="input-glass w-full !pl-16 !bg-zinc-950/60 !rounded-[2.5rem] border-white/5 focus:border-emerald-500/40 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => navigate('/workflow/new')}
            className="btn-emerald group/btn"
          >
            <Plus size={26} strokeWidth={3} className="group-hover/btn:rotate-180 transition-transform duration-700" />
            <span className="uppercase tracking-[0.2em] text-[13px] font-black">Initialize New Node</span>
          </button>
        </div>
      </div>

      {/* Protocol Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        <AnimatePresence mode="popLayout">
          {filteredWorkflows.map((wf, index) => (
            <motion.div
              layout
              key={wf.id}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="glass-card h-[450px] group flex flex-col relative overflow-hidden active:scale-95 transition-transform">
                {/* Visual Glow Layer */}
                <div className={`absolute -top-20 -right-20 w-64 h-64 blur-[80px] rounded-full transition-all duration-1000 opacity-30 ${wf.is_active ? 'bg-emerald-500 group-hover:bg-emerald-400 group-hover:opacity-60' : 'bg-rose-500 group-hover:bg-rose-400 opacity-20'}`}></div>
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className={`p-5 rounded-[2rem] ${wf.is_active ? 'glass-emerald' : 'bg-white/5 border border-white/10 text-zinc-600'} transition-all duration-700 shadow-xl group-hover:shadow-emerald-500/20`}>
                    <Layers size={28} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/workflow/${wf.id}`); }} className="p-4 glass rounded-2xl text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-all shadow-lg active:scale-90">
                      <Edit3 size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDuplicate(wf.id); }} className="p-4 glass rounded-2xl text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/40 transition-all shadow-lg active:scale-90">
                      <Copy size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(wf.id); }} className="p-4 glass rounded-2xl text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 transition-all shadow-lg active:scale-90">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 flex-1 relative z-10">
                  <div>
                    <h3 className="text-3xl font-black text-main tracking-tight uppercase group-hover:text-emerald-400 transition-colors duration-700 truncate mb-1">{wf.name}</h3>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black text-dim tracking-[0.4em] uppercase opacity-50">Node v{wf.version || 3}.0</p>
                        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                        <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-tighter">ID: {wf.id.split('-')[0]}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <div className="px-5 py-3 glass rounded-[1.25rem] flex items-center gap-3 border-white/5 group-hover:border-emerald-500/20 transition-all">
                        <Activity size={14} className="text-emerald-500" />
                        <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest">{wf.step_count || 0} Steps</span>
                    </div>
                    <div className={`px-5 py-3 rounded-[1.25rem] border transition-all duration-500 ${wf.is_active ? 'glass-emerald border-emerald-500/30' : 'bg-white/5 border-white/10 text-zinc-700'}`}>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                            {wf.is_active ? 'Live Sync' : 'Offline'}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-10">
                    <button 
                    onClick={() => navigate(`/execute/${wf.id}`)}
                    className="w-full p-6 rounded-[2rem] bg-zinc-950/60 border border-white/5 hover:border-emerald-500/40 flex items-center justify-center gap-5 group/play transition-all duration-700 hover:bg-emerald-500/5 group-hover:-translate-y-2 shadow-2xl relative overflow-hidden"
                    >
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/play:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-emerald-500 group-hover/play:scale-110 transition-transform shadow-2xl relative z-10">
                        <Play size={22} fill="currentColor" strokeWidth={0} />
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-[0.4em] text-zinc-400 group-hover/play:text-emerald-400 transition-colors relative z-10">Invoke Protocol</span>
                    <ArrowRight size={20} className="text-emerald-500 opacity-0 -translate-x-6 group-hover/play:opacity-100 group-hover/play:translate-x-0 transition-all duration-700 relative z-10" />
                    </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="py-48 text-center glass rounded-[4rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center mesh-gradient">
            <div className="w-32 h-32 rounded-[3rem] bg-white/5 flex items-center justify-center mb-10 animate-pulse-soft border border-white/5">
                <Search size={56} className="text-zinc-800" />
            </div>
            <h2 className="text-3xl font-black text-zinc-700 uppercase tracking-[0.5em]">No Signal Detected</h2>
            <p className="text-xs font-bold text-zinc-800 mt-4 uppercase tracking-[0.2em] opacity-60">Synchronize search parameters or initialize new registry node</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowList;
