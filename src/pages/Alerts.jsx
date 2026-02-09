import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldAlert, Check, AlertTriangle, Clock, Activity, MessageSquare } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();

        const subscription = supabase
            .channel('alerts-page-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, payload => {
                setAlerts(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
    }, []);

    const fetchAlerts = async () => {
        try {
            const { data } = await supabase
                .from('alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setAlerts(data);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (id) => {
        const { error } = await supabase.from('alerts').update({ acknowledged: true }).eq('id', id);
        if (!error) {
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
        }
    };

    if (loading) return (
        <div className="w-full h-full flex items-center justify-center">
            <Activity className="w-12 h-12 text-rose-500 animate-pulse" />
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto p-2 md:p-6 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Bell className="w-8 h-8 text-rose-500" />
                        System Broadcasts
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Autonomous safety notifications and risk vectors</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">{alerts.filter(a => !a.acknowledged).length} ACTIVE</span>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${alert.severity === 'critical' ? 'bg-rose-950/30 border-rose-500/30' :
                                alert.severity === 'warning' ? 'bg-amber-950/30 border-amber-500/30' : 'bg-slate-900/50 border-white/5'} ${alert.acknowledged ? 'opacity-50 grayscale' : 'opacity-100'}`}
                        >
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div className="flex gap-5 items-start">
                                    <div className={`p-4 rounded-2xl ${alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                                            alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {alert.severity === 'critical' ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${alert.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                                    alert.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                                }`}>
                                                {alert.severity}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(alert.created_at).toLocaleString()}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-2">{alert.message.split('ACTION:')[0].replace('AI LOGIC:', '')}</h3>

                                        {alert.message.includes('ACTION:') && (
                                            <div className="flex items-start gap-2 mt-3 bg-black/20 p-3 rounded-xl border border-white/5">
                                                <Activity className="w-4 h-4 text-cyan-400 mt-0.5" />
                                                <span className="text-xs text-cyan-200 font-mono">
                                                    <span className="text-cyan-500 font-bold uppercase tracking-wider mr-2">PROTOCOL REQUIRED:</span>
                                                    {alert.message.split('ACTION:')[1]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!alert.acknowledged && (
                                    <button
                                        onClick={() => acknowledgeAlert(alert.id)}
                                        className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-xs font-bold flex items-center gap-2 group/btn whitespace-nowrap"
                                    >
                                        <Check className="w-4 h-4" />
                                        ACKNOWLEDGE
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {alerts.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">All Systems Nominal</h3>
                        <p className="text-slate-500 text-sm mt-2">No active warnings detected by Sentinel-X.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
