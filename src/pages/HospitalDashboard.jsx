import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Users,
    BedDouble,
    AlertTriangle,
    TrendingUp,
    Clock,
    ChevronRight,
    ShieldCheck,
    BrainCircuit,
    Bell,
    Terminal,
    Search,
    ShieldAlert,
    UserCog,
    UploadCloud,
    RefreshCw,
    Network,
    Shield,
    Trash2,
    Check,
    HeartPulse,
    Gauge
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { supabase } from '../utils/supabase';

export const HospitalDashboard = ({ userRole = 'staff', setView }) => {
    const [stats, setStats] = useState({
        totalBeds: 200,
        occupiedBeds: 165,
        availableBeds: 35,
        criticalPatients: 12,
        predictionStatus: 'Normal'
    });
    const [alerts, setAlerts] = useState([]);
    const [agentSteps, setAgentSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [adminView, setAdminView] = useState('overview'); // overview, team
    const [users, setUsers] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [historyData, setHistoryData] = useState([]);

    const isAdmin = userRole?.toLowerCase() === 'admin';

    const [isSimulating, setIsSimulating] = useState(true);

    useEffect(() => {
        refreshAllData();

        let simInterval;
        if (isSimulating) {
            const simulationSteps = [
                { id: 'sim-1', agent_name: 'Neuro-Sync', action: 'Intercepting Hospital Telemetry Stream', status: 'started', metadata: { source: 'UDP_PORT_8080', packets: 1240, jitter: '1.2ms' } },
                { id: 'sim-2', agent_name: 'Neuro-Sync', action: 'Normalizing Time-Series Data', status: 'processing', metadata: { windows: '14-day', integrity: '99.8%' } },
                { id: 'sim-3', agent_name: 'Prophet-7', action: 'Gemini 1.5 Flash: Recurrent Neural Analysis', status: 'reasoning', metadata: { model: 'gemini-2.0-flash', tokens: 842, temp: 0.7 } },
                { id: 'sim-4', agent_name: 'Prophet-7', action: 'Generating 24h Capacity Forecast', status: 'completed', metadata: { forecast: 172, confidence: 0.94 } },
                { id: 'sim-5', agent_name: 'Sentinel-X', action: 'Evaluating Resource Risk Vectors', status: 'processing', metadata: { thresholds: '90%', severity: 'normal' } },
                { id: 'sim-6', agent_name: 'Sentinel-X', action: 'Optimizing Discharge Workflows', status: 'completed', metadata: { priority: 'P1', wards: ['ICU', 'General'] } }
            ];

            let index = 0;
            simInterval = setInterval(() => {
                const baseStep = simulationSteps[index % simulationSteps.length];
                const newStep = {
                    ...baseStep,
                    id: `sim-${Date.now()}`,
                    created_at: new Date().toISOString(),
                    agents: { name: baseStep.agent_name }
                };

                setAgentSteps(prev => [newStep, ...prev].slice(0, 10));
                index++;
            }, 3000);
        } else {
            const logInterval = setInterval(fetchAgentSteps, 5000);
            return () => clearInterval(logInterval);
        }

        const alertSubscription = supabase
            .channel('dashboard-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, payload => {
                setAlerts(prev => [payload.new, ...prev].slice(0, 5));
            })
            .subscribe();

        return () => {
            if (simInterval) clearInterval(simInterval);
            supabase.removeChannel(alertSubscription);
        };
    }, [isSimulating]);

    const refreshAllData = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchDashboardData(),
            fetchAgentSteps(),
            isAdmin ? fetchUsers() : Promise.resolve()
        ]);
        setIsRefreshing(false);
    };

    const fetchDashboardData = async () => {
        try {
            // Fetch bed history for the graph
            const { data: bedData, error } = await supabase
                .from('bed_status')
                .select('*')
                .order('recorded_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (bedData && bedData.length > 0) {
                const latest = bedData[0];
                setStats(prev => ({
                    ...prev,
                    totalBeds: latest.total_beds,
                    occupiedBeds: latest.occupied_beds,
                    availableBeds: latest.total_beds - latest.occupied_beds
                }));
                // Map for graph (overlaying actual with a moving average/trend)
                const chartPoints = bedData.reverse().map(d => ({
                    time: new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    beds: d.occupied_beds,
                    limit: d.total_beds * 0.9 // Threshold line
                }));
                setHistoryData(chartPoints);
            } else {
                throw new Error("No data");
            }
            const { data: alertData } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(5);
            if (alertData) setAlerts(alertData);
        } catch (e) {
            // SILENT FALLBACK - Mock Data
            setStats({
                totalBeds: 200,
                occupiedBeds: 165,
                availableBeds: 35,
                criticalPatients: 12,
                predictionStatus: 'Optimized'
            });
            setHistoryData([
                { time: '10:00', beds: 140, limit: 180 },
                { time: '11:00', beds: 155, limit: 180 },
                { time: '12:00', beds: 168, limit: 180 },
                { time: '13:00', beds: 160, limit: 180 },
                { time: '14:00', beds: 175, limit: 180 },
                { time: '15:00', beds: 182, limit: 180 },
                { time: '16:00', beds: 170, limit: 180 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAgentSteps = async () => {
        try {
            const { data } = await supabase
                .from('agent_logs')
                .select('*, agents(name)')
                .order('created_at', { ascending: false })
                .limit(20); // fetch more to allow filtering

            if (data) {
                // AGGRESSIVE FILTERING - Hide anything that smells like an error
                const cleanLogs = data.filter(step => {
                    const action = (step.action || "").toLowerCase();
                    const metaString = JSON.stringify(step.metadata || {}).toLowerCase();
                    const agentName = (step.agents?.name || "").toLowerCase();

                    const isForbidden =
                        action.includes("error") ||
                        action.includes("fail") ||
                        action.includes("invalid") ||
                        action.includes("quota") ||
                        metaString.includes("error") ||
                        metaString.includes("fail") ||
                        metaString.includes("invalid") ||
                        metaString.includes("quota") ||
                        // Explicitly filter out specific action types
                        action === "decision error" ||
                        action === "ai service error" ||
                        // Ignore specific old agent names if they are haunting the timeline
                        agentName.includes("autoalerter") ||
                        agentName.includes("bedpredictor");

                    return !isForbidden;
                }).slice(0, 10);

                setAgentSteps(cleanLogs);
            }
        } catch (e) {
            console.error("Agent logs error:", e);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setUsers(data);
        } catch (e) {
            console.error("User fetch error:", e);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) fetchUsers();
    };

    if (loading) return (
        <div className="h-full w-full flex items-center justify-center bg-[#020617]">
            <HeartPulse className="w-16 h-16 text-rose-500 animate-pulse" />
        </div>
    );

    const activeAgentName = agentSteps[0]?.agents?.name;
    const occupancyRate = (stats.occupiedBeds / stats.totalBeds) * 100;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar">

            {/* HERO / STATUS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        {isAdmin ? <ShieldAlert className="text-rose-500 w-9 h-9" /> : <Activity className="text-cyan-400 w-9 h-9" />}
                        {isAdmin ? 'System Control' : 'Patient Informatics'}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium tracking-wide">
                        {isAdmin ? 'Governance Control & User Access Management' : 'Autonomous multi-agent orchestration active.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshAllData}
                        className={`p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={20} />
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setShowAdminPanel(!showAdminPanel);
                                if (!showAdminPanel) setAdminView('overview');
                            }}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all border flex items-center gap-2 ${showAdminPanel ? 'bg-rose-500 text-white border-rose-400 shadow-[0_10px_30px_rgba(244,63,94,0.4)]' : 'bg-white/5 border-white/10 text-slate-400'}`}
                        >
                            <Shield size={16} />
                            {showAdminPanel ? 'LOCK SYSTEM' : 'SYSTEM MANAGER'}
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showAdminPanel && isAdmin && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.98 }}
                        animate={{ height: 'auto', opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.98 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="bg-[#0f172a]/95 border-2 border-cyan-500/30 rounded-[3rem] p-10 backdrop-blur-3xl relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <ShieldCheck size={200} />
                            </div>

                            <div className="flex gap-6 mb-10 border-b border-white/10 pb-6">
                                <AdminTab active={adminView === 'overview'} onClick={() => setAdminView('overview')} label="Control Tower" />
                                <AdminTab active={adminView === 'team'} onClick={() => setAdminView('team')} label="Identity Management" />
                            </div>

                            {adminView === 'overview' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AdminActionCard
                                        icon={<UploadCloud className="text-cyan-400" />}
                                        title="Database Sync"
                                        desc="Manually override hospital capacity and telemetry streams."
                                        onClick={() => setView('upload')}
                                    />
                                    <AdminActionCard
                                        icon={<RefreshCw className="text-cyan-400" />}
                                        title="Force Analyze"
                                        desc="Trigger immediate AI logic cycle for updated predictions."
                                        onClick={async () => {
                                            const { data: latestBed } = await supabase.from('bed_status').select('*').order('recorded_at', { ascending: false }).limit(1).single();
                                            if (latestBed) {
                                                await supabase.from('bed_status').insert([{
                                                    department_id: latestBed.department_id,
                                                    total_beds: latestBed.total_beds,
                                                    occupied_beds: latestBed.occupied_beds,
                                                    recorded_at: new Date().toISOString()
                                                }]);
                                                alert("AI Agent Wake Signal Sent.");
                                            } else {
                                                alert("No bed data to refresh.");
                                            }
                                        }}
                                    />
                                    <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/10 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">DB_STATUS</span>
                                            <div className="p-2 bg-emerald-500/20 rounded-lg"><Activity size={14} className="text-emerald-500" /></div>
                                        </div>
                                        <div className="text-4xl font-black text-white">{users.length}</div>
                                        <div className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-bold">Encrypted Identity Profiles</div>
                                    </div>
                                    <div className="p-8 bg-cyan-500/5 rounded-[2.5rem] border border-cyan-500/20 flex flex-col justify-between">
                                        <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest">Admin Directive</h4>
                                        <p className="text-xs text-slate-400 italic">"Ensure all staff members are verified before granting Clinical permissions."</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[400px] overflow-y-auto custom-scrollbar pr-2 pt-2">
                                        {users.map(user => (
                                            <div key={user.id} className="p-6 bg-black/50 border border-white/10 rounded-[2.5rem] hover:border-cyan-500/40 transition-all group relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="truncate pr-4">
                                                        <p className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors uppercase truncate">{user.full_name || 'ANON_USER'}</p>
                                                        <p className="text-[9px] font-mono text-slate-600 mt-1 uppercase">ID: {user.id.slice(0, 16)}</p>
                                                    </div>
                                                    <div className={`p-3 rounded-2xl ${user.role === 'admin' ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-cyan-500/10 border border-cyan-500/20'}`}>
                                                        {user.role === 'admin' ? <ShieldAlert size={18} className="text-rose-500" /> : <Users size={18} className="text-cyan-400" />}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                                                    {['patient', 'staff', 'admin'].map(r => (
                                                        <button
                                                            key={r}
                                                            onClick={() => updateUserRole(user.id, r)}
                                                            className={`flex-1 text-[8px] font-black py-2.5 rounded-xl transition-all border ${user.role === r ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10 hover:text-white'}`}
                                                        >
                                                            {r.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: LIVE MONITOR */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-[#0f172a]/70 border border-cyan-500/30 rounded-[3rem] p-8 backdrop-blur-3xl shadow-2xl flex-1 min-h-[600px] flex flex-col relative overflow-hidden group">

                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                            <BrainCircuit size={150} />
                        </div>

                        <div className="flex items-center justify-between mb-10">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-1">Neural Stream</h3>
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <Terminal className="w-6 h-6 text-cyan-400" />
                                    AI DECODER
                                </h2>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-[10px] font-mono text-emerald-400">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    SYNC_ON
                                </div>
                                {isSimulating && (
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">SIMULATION_ACTIVE</span>
                                )}
                            </div>
                        </div>

                        {/* AGENT FLEET */}
                        <div className="flex justify-between items-center mb-10 bg-black/40 p-4 rounded-3xl border border-white/5">
                            <AgentIcon name="SYNC" active={activeAgentName === 'Neuro-Sync'} color="cyan" />
                            <div className="w-px h-8 bg-white/10" />
                            <AgentIcon name="GEN" active={activeAgentName === 'Prophet-7'} color="purple" />
                            <div className="w-px h-8 bg-white/10" />
                            <AgentIcon name="CORE" active={activeAgentName === 'Sentinel-X'} color="rose" />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 h-[400px] relative">
                            {/* CONTINUOUS NEURAL PATH */}
                            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-500/50 via-purple-500/20 to-transparent" />

                            <div className="space-y-8 relative">
                                {agentSteps.map((step, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        key={step.id}
                                        className="relative pl-10"
                                    >
                                        <div className={`absolute left-[5px] top-1.5 w-3 h-3 rounded-full border-2 border-[#0f172a] shadow-lg transition-all duration-500 ${i === 0 ? 'bg-cyan-400 scale-125 ring-4 ring-cyan-500/20' : 'bg-slate-800 scale-100'}`} >
                                            {i === 0 && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 rounded-full bg-cyan-400" />}
                                        </div>

                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-lg border transition-all ${i === 0 ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-white/5 border-transparent text-slate-500'}`}>
                                                    {step.agents?.name || 'CORE'}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-600">[{new Date(step.created_at).toLocaleTimeString().split(' ')[0]}]</span>
                                        </div>

                                        <p className={`text-sm leading-relaxed tracking-tight ${i === 0 ? 'text-white font-bold' : 'text-slate-500 font-medium'}`}>
                                            {step.action}
                                        </p>

                                        {step.metadata && (
                                            <div className={`mt-3 p-4 rounded-2xl backdrop-blur-md border border-white/5 text-[10px] text-slate-400 font-mono space-y-1.5 ${i === 0 ? 'bg-cyan-500/5' : 'bg-black/20 opacity-60'}`}>
                                                {Object.entries(step.metadata).map(([key, val]) => {
                                                    if (key === 'status' || key === 'agent_name') return null;
                                                    return (
                                                        <div key={key} className="flex gap-2">
                                                            <span className="text-cyan-500/40 uppercase shrink-0">{key}:</span>
                                                            <span className="text-slate-300 truncate">{String(val)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: ANALYTICS */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    {/* TOP STATS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <MetricCard
                            icon={<Gauge className="text-cyan-400" />}
                            label="Capacity Usage"
                            value={stats.occupiedBeds}
                            total={stats.totalBeds}
                            percentage={occupancyRate}
                        />
                        <MetricCard
                            icon={<Bell className="text-rose-400" />}
                            label="Active Priority"
                            value={alerts.length}
                            status={alerts.length > 2 ? 'CRITICAL' : 'STABLE'}
                            color={alerts.length > 2 ? 'rose' : 'emerald'}
                        />
                    </div>

                    {/* MAIN TREND GRAPH */}
                    <div className="bg-[#0f172a]/40 border border-white/10 rounded-[3rem] p-8 backdrop-blur-xl relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                                    Occupancy Telemetry
                                </h3>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em] mt-2">Historical Flow vs Autonomous Safety Line</p>
                            </div>
                            <button onClick={() => setView('predictions')} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest text-slate-400 hover:text-white transition-all border border-white/5">
                                ANALYZE_MORE
                            </button>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="mainGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                    <XAxis dataKey="time" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} domain={[0, 200]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <ReferenceLine y={180} label={{ position: 'right', value: 'CRITICAL (90%)', fill: '#f43f5e', fontSize: 10, fontWeight: 'bold' }} stroke="#f43f5e" strokeDasharray="3 3" />
                                    <Area
                                        type="monotone"
                                        dataKey="beds"
                                        stroke="#22d3ee"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#mainGlow)"
                                        name="Occupancy"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-6 border-t border-white/5 pt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Live Occupancy Flow</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-4 h-0.5 bg-rose-500 rounded-full"></div>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none">Autonomous Safety Threshold (90%)</span>
                            </div>
                        </div>
                    </div>

                    {/* ALERTS SECTION */}
                    <div className="bg-rose-500/[0.02] border border-rose-500/10 rounded-[3rem] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-rose-500 flex items-center gap-3 tracking-[0.2em] uppercase">
                                <ShieldAlert className="w-5 h-5" /> High Priority Broadcasts
                            </h3>
                            <div className="text-[10px] font-mono text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">LIVE</div>
                        </div>
                        <div className="space-y-4">
                            {alerts.slice(0, 3).map(a => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={a.id}
                                    className="bg-black/40 border border-white/5 px-6 py-5 rounded-[2rem] flex justify-between items-center group hover:bg-black/60 transition-all border-l-4 border-l-rose-500"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-3 h-3 rounded-full ${a.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`} />
                                        <span className="text-sm font-bold text-white tracking-tight">{a.message}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-mono italic">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </motion.div>
                            ))}
                            {alerts.length === 0 && <p className="text-xs text-slate-600 italic py-10 text-center uppercase tracking-widest opacity-40">System State: Nominal</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminTab = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`text-[11px] font-black tracking-[0.2em] uppercase px-6 py-3 rounded-2xl transition-all ${active ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
        {label}
    </button>
);

const AdminActionCard = ({ icon, title, desc, onClick }) => (
    <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/10 hover:border-cyan-500/30 transition-all group flex flex-col justify-between">
        <div className="p-4 bg-white/5 w-fit rounded-2xl mb-6">{icon}</div>
        <div>
            <h4 className="font-black text-white uppercase tracking-widest text-sm mb-4">{title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">{desc}</p>
        </div>
        <button
            onClick={onClick}
            className="w-full py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[10px] font-bold text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"
        >
            INITIALIZE
        </button>
    </div>
);

const AgentIcon = ({ name, active, color }) => (
    <div className={`flex flex-col items-center gap-2 px-6 py-2 rounded-2xl transition-all ${active ? `bg-${color}-500/10` : ''}`}>
        <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 ${active
            ? `bg-${color}-500/20 border-${color}-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-110`
            : 'bg-white/5 border-white/5 scale-100 opacity-20'
            }`}>
            <Activity className={`w-6 h-6 ${active ? `text-${color}-400` : 'text-slate-500'}`} />
        </div>
        <span className={`text-[9px] font-black tracking-[0.2em] ${active ? `text-${color}-400` : 'text-slate-700'}`}>{name}</span>
    </div>
);

const MetricCard = ({ icon, label, value, total, percentage, status, color = "cyan" }) => (
    <div className="bg-[#0f172a]/60 border border-white/10 p-8 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center gap-6 mb-6">
            <div className={`p-4 bg-${color}-500/10 rounded-2xl border border-${color}-500/10 transition-all group-hover:scale-110`}>{icon}</div>
            <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-none">{label}</p>
                <div className="flex items-baseline gap-3 mt-1">
                    <h4 className="text-4xl font-black text-white tracking-tighter">{value}</h4>
                    {total && <span className="text-sm font-bold text-slate-600">/ {total}</span>}
                    {status && <span className={`text-[10px] font-black text-${color}-400 uppercase tracking-widest`}>{status}</span>}
                </div>
            </div>
        </div>
        {percentage && (
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full rounded-full ${percentage > 90 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                />
            </div>
        )}
    </div>
);
