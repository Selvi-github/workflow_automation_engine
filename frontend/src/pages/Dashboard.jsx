import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, CheckCircle2, Clock, Activity, Loader2, Zap, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import api from '../api/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workflowsRes, exRes] = await Promise.all([
        api.get('/workflows?limit=100'),
        api.get('/executions?limit=100')
      ]);

      const workflows = workflowsRes.data;
      const executions = exRes.data;

      const completed = executions.filter(e => e.status === 'completed');
      const totalExecs = executions.length;
      const successRate = totalExecs ? Math.round((completed.length / totalExecs) * 100) : 0;

      let totalDuration = 0;
      let durationCount = 0;
      completed.forEach(e => {
         if (e.started_at && e.ended_at) {
             const dur = new Date(e.ended_at) - new Date(e.started_at);
             if (dur > 0) { totalDuration += dur; durationCount++; }
         }
      });
      const avgDuration = durationCount ? (totalDuration / durationCount / 1000).toFixed(1) + 's' : '0s';

      setStats({
          totalWorkflows: workflows.length,
          totalExecutions: totalExecs,
          successRate: `${successRate}%`,
          avgDuration
      });

      const wfStats = {};
      workflows.forEach(w => { wfStats[w.name] = { name: w.name, completed: 0, failed: 0, in_progress: 0 }; });
      executions.forEach(e => {
          const wf = workflows.find(w => w.id === e.workflow_id);
          if (wf && wfStats[wf.name]) { wfStats[wf.name][e.status] = (wfStats[wf.name][e.status] || 0) + 1; }
      });
      setChartData(Object.values(wfStats).filter(d => d.completed + d.failed + d.in_progress > 0));
      setRecentExecutions(executions.slice(0, 8));
    } catch (err) { toast.error('Analytics Outage'); } finally { setLoading(false); }
  };

  if (loading) return <div className="max-w-7xl mx-auto space-y-12 animate-pulse pt-10"><div className="h-40 glass rounded-[3.5rem]" /><div className="grid grid-cols-1 md:grid-cols-4 gap-8">{[1, 2, 3, 4].map(i => <div key={i} className="h-32 glass rounded-[2.5rem]" />)}</div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-12 pb-24">
      <div className="flex justify-between items-center glass p-8 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 blur-[120px] -z-10"></div>
        <div className="flex items-center gap-6">
          <div className="p-4 glass-emerald rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <LayoutDashboard size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-main tracking-tighter uppercase">Command Central</h1>
            <p className="text-[10px] font-bold text-dim mt-1 uppercase tracking-[0.4em] opacity-60 italic">Real-time Engine Intelligence</p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-emerald flex items-center gap-3">
          <TrendingUp size={20} /> Refresh Matrix
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: 'Protocols', value: stats.totalWorkflows, icon: <FileText size={24} />, color: 'emerald' },
            { label: 'Uplinks', value: stats.totalExecutions, icon: <Activity size={24} />, color: 'emerald' },
            { label: 'Stability', value: stats.successRate, icon: <CheckCircle2 size={24} />, color: 'emerald' },
            { label: 'Latency', value: stats.avgDuration, icon: <Clock size={24} />, color: 'emerald' },
          ].map((s, i) => (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }} key={s.label} className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl group hover:border-emerald-500/30 transition-all duration-500">
               <div className="flex items-center gap-5">
                   <div className="p-3 glass rounded-2xl bg-white/5 text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                       {s.icon}
                   </div>
                   <div>
                       <p className="text-[9px] font-black text-dim uppercase tracking-widest">{s.label}</p>
                       <p className="text-2xl font-black text-main tracking-tighter mt-1">{s.value}</p>
                   </div>
               </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 glass p-8 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                  <h2 className="text-xl font-black text-main uppercase tracking-tight flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      Activity Spectrum
                  </h2>
                  <div className="flex items-center gap-6">
                      {['completed', 'failed', 'in_progress'].map(t => (
                          <div key={t} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${t === 'completed' ? 'bg-emerald-500' : t === 'failed' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                              <span className="text-[10px] font-black text-dim uppercase tracking-tighter">{t}</span>
                          </div>
                      ))}
                  </div>
              </div>
              
              {chartData.length > 0 ? (
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height={384}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                      <XAxis dataKey="name" tick={{fontSize: 9, fill: 'var(--text-dim)', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 9, fill: 'var(--text-dim)', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: 'var(--glass-border)', opacity: 0.1}} 
                        contentStyle={{backgroundColor: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: '1.5rem', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)'}}
                        itemStyle={{color: 'var(--text-main)', fontWeight: 'black', fontSize: '9px', textTransform: 'uppercase'}}
                      />
                      <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 10, 10]} barSize={40} />
                      <Bar dataKey="in_progress" stackId="a" fill="#6366f1" barSize={40} />
                      <Bar dataKey="failed" stackId="a" fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-zinc-700 space-y-4">
                  <Activity size={48} strokeWidth={1} className="opacity-20" />
                  <p className="text-[10px] uppercase font-black tracking-widest italic opacity-40">Insufficient trace data to render matrix.</p>
                </div>
              )}
          </div>

          <div className="lg:col-span-4 glass p-8 rounded-[3.5rem] border border-white/5 shadow-2xl h-fit">
              <h2 className="text-xl font-black text-main uppercase tracking-tight mb-10 flex items-center justify-between">
                  Recent Trace
                  <ArrowUpRight size={18} className="text-dim" />
              </h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {recentExecutions.length === 0 ? (
                      <div className="py-20 text-center text-zinc-700">
                          <Clock size={32} className="mx-auto mb-4 opacity-10" />
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Silent environment</p>
                      </div>
                  ) : (
                      recentExecutions.map(ex => (
                          <div key={ex.id} className="p-5 glass-card bg-zinc-950/20 hover:border-emerald-500/20 transition-all group cursor-default">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <p className="font-black text-xs text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors truncate max-w-[120px]">{ex.workflow_name || 'Protocol Unknown'}</p>
                                     <p className="text-[9px] font-mono text-zinc-600 mt-1 uppercase tracking-tighter italic">x-{ex.id.split('-')[0]}</p>
                                 </div>
                                 <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                     ex.status === 'completed' ? 'glass-emerald border-emerald-500/20 text-emerald-400' : 
                                     ex.status === 'failed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 
                                     'glass border-white/5 text-zinc-500'
                                 }`}>
                                     <div className={`w-1 h-1 rounded-full ${ex.status === 'completed' ? 'bg-emerald-400' : 'bg-zinc-600'}`}></div>
                                     {ex.status}
                                 </div>
                              </div>
                              <div className="flex justify-between items-center text-[8px] font-black text-dim uppercase tracking-widest opacity-60">
                                  <span>{ex.triggered_by}</span>
                                  <span className="font-mono">{new Date(ex.started_at).toLocaleTimeString()}</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
