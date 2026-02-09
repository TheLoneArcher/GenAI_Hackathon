import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle2, History, Database, ArrowRight, Activity } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const DataUpload = () => {
    const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({
        deptId: '',
        totalBeds: 200,
        occupiedBeds: 165
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        const { data } = await supabase.from('departments').select('*');
        if (data) {
            setDepartments(data);
            if (data.length > 0) setFormData(prev => ({ ...prev, deptId: data[0].id }));
        }
    };

    const handleSync = async (e) => {
        e.preventDefault();
        setUploadState('uploading');

        try {
            const { error } = await supabase.from('bed_status').insert([
                {
                    department_id: formData.deptId,
                    total_beds: parseInt(formData.totalBeds),
                    occupied_beds: parseInt(formData.occupiedBeds)
                }
            ]);

            if (error) throw error;

            // Log activity
            const { data: agentData } = await supabase.from('agents').select('id').eq('agent_type', 'data_acquisition').limit(1);
            if (agentData && agentData[0]) {
                await supabase.from('agent_logs').insert([
                    {
                        agent_id: agentData[0].id,
                        action: 'Data Sync',
                        metadata: { message: `Manually updated bed status for department.` }
                    }
                ]);
            }

            setUploadState('success');
            setTimeout(() => setUploadState('idle'), 3000);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadState('idle');
            alert('Error syncing data. Make sure schema is applied in Supabase.');
        }
    };

    return (
        <div className="flex flex-col gap-8 p-1 md:p-6 w-full max-w-7xl mx-auto overflow-y-auto">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Data Management</h1>
                <p className="text-slate-400 text-sm">Upload admission records and bed usage for AI analysis</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* UPLOAD BOX */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>

                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-cyan-400" />
                        Direct Entry / Bulk Upload
                    </h3>

                    <form onSubmit={handleSync} className="space-y-6">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Target Department</label>
                            <select
                                value={formData.deptId}
                                onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-cyan-500/50 transition-colors cursor-pointer"
                            >
                                {departments.map(d => (
                                    <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
                                ))}
                                {departments.length === 0 && <option className="bg-slate-900">No departments found</option>}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Total Capacity</label>
                                <input
                                    type="number"
                                    value={formData.totalBeds}
                                    onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-cyan-500/50 transition-colors"
                                    placeholder="200"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Currently Occupied</label>
                                <input
                                    type="number"
                                    value={formData.occupiedBeds}
                                    onChange={(e) => setFormData({ ...formData, occupiedBeds: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-cyan-500/50 transition-colors"
                                    placeholder="165"
                                />
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-cyan-500/30 transition-all group cursor-pointer bg-white/[0.02]">
                            <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-slate-500 group-hover:text-cyan-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-300">Drop CSV/XLSX Files Here</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Direct System Integration Active</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploadState !== 'idle' || !formData.deptId}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${uploadState === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-cyan-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                } disabled:opacity-50`}
                        >
                            {uploadState === 'idle' && <>SYNC DATA <ArrowRight className="w-4 h-4" /></>}
                            {uploadState === 'uploading' && <span className="animate-pulse flex items-center gap-2"><Activity className="w-4 h-4" /> AGENTS PROCESSING...</span>}
                            {uploadState === 'success' && <><CheckCircle2 className="w-4 h-4" /> SUCCESS! DASHBOARD UPDATED</>}
                        </button>
                    </form>
                </div>

                {/* LOGS / HISTORY */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-300">
                            <History className="w-5 h-5 text-purple-400" />
                            Recent Activity
                        </h4>
                        <div className="space-y-4">
                            <HistoryItem date="Live Sync" file="Internal API" status="Optimized" />
                            <HistoryItem date="Feb 09 - 08:32" file="daily_admissions.csv" status="Verified" />
                            <HistoryItem date="Feb 08 - 20:15" file="ward_census.xlsx" status="Verified" />
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-300">
                            <Database className="w-5 h-5 text-cyan-400" />
                            Integration Health
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-slate-500 mb-1 uppercase font-bold text-[9px]">HIS Connector</p>
                                <p className="text-emerald-400 font-bold flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    CONNECTED
                                </p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-slate-500 mb-1 uppercase font-bold text-[9px]">Data Pipeline</p>
                                <p className="text-cyan-400 font-bold">READY</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HistoryItem = ({ date, file, status }) => (
    <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors group">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg">
                <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div>
                <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{file}</p>
                <p className="text-[10px] text-slate-500">{date}</p>
            </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">{status}</span>
    </div>
);
