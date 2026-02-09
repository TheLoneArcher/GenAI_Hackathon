import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { Scene } from './components/Scene'
import { StarField } from './components/StarField'
import { Login } from './components/Login'
import { SignUp } from './components/SignUp'
import { HospitalDashboard } from './pages/HospitalDashboard'
import { Predictions } from './pages/Predictions'
import { DataUpload } from './pages/DataUpload'
import { Alerts } from './pages/Alerts'
import { supabase } from './utils/supabase'
import {
    ArrowRight,
    BrainCircuit,
    Activity,
    ShieldCheck,
    Stethoscope,
    LayoutDashboard,
    LogOut,
    User,
    BarChart3,
    UploadCloud,
    Bell
} from 'lucide-react'

function App() {
    const [status, setStatus] = useState('initializing')
    const [session, setSession] = useState(null)
    const [view, setView] = useState('landing') // landing, login, signup, dashboard, predictions, upload, alerts
    const [userRole, setUserRole] = useState(null) // admin, staff, patient

    useEffect(() => {
        const fetchRole = async (user) => {
            if (!user) return;
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (data) setUserRole(data.role.toLowerCase());
            else setUserRole('patient');
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchRole(session.user);
                setView('dashboard');
            }
            setStatus('ready')
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchRole(session.user);
                setView('dashboard');
            } else {
                setView('landing');
                setUserRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGuestLogin = (roleInput = 'staff') => {
        const role = roleInput.toLowerCase();
        setSession({
            user: { email: `${role}@hospital.ai`, id: `guest-${role}` }
        })
        setUserRole(role)
        setView('dashboard')
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setUserRole(null)
        setView('landing')
    }

    // Determine if we should show the 3D Core in the background
    const showBackgroundCore = view === 'landing' || view === 'login' || view === 'signup';

    if (status === 'initializing') {
        return <div className="w-full h-screen bg-[#020617] flex items-center justify-center">
            <BrainCircuit className="w-12 h-12 text-cyan-500 animate-pulse" />
        </div>
    }

    return (
        <div className="w-full h-screen bg-[#020617] text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">

            {/* PERSISTENT BACKGROUND LAYER */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-40">
                    <Canvas camera={{ position: [0, 0, 1], fov: 100 }}>
                        <StarField count={400} />
                    </Canvas>
                </div>

                <AnimatePresence>
                    {showBackgroundCore && (
                        <motion.div
                            key="ai-core-bg"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <div className={`w-full h-full lg:w-3/5 lg:absolute lg:right-0 transition-all duration-1000 ${view !== 'landing' ? 'blur-xl opacity-20 scale-125' : ''}`}>
                                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                                    <Scene />
                                    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
                                </Canvas>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* GLOBAL NAVBAR */}
            <header className="absolute top-0 left-0 w-full z-50 h-20 px-6 md:px-12 flex items-center justify-between border-b border-white/5 backdrop-blur-xl bg-black/20">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(session ? 'dashboard' : 'landing')}>
                    <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                        <Stethoscope className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight text-white leading-none">
                            MED_NEXUS
                        </span>
                        <span className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase mt-0.5">Capacity AI</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!session ? (
                        <>
                            <button onClick={() => setView('login')} className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors">Sign In</button>
                            <button onClick={() => setView('signup')} className="px-5 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]">JOIN SYSTEM</button>
                        </>
                    ) : (
                        <div className="flex items-center gap-6">
                            <nav className="hidden lg:flex items-center gap-8 mr-4">
                                <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
                                <NavButton active={view === 'predictions'} onClick={() => setView('predictions')} icon={<BarChart3 size={18} />} label="Forecast" />
                                {(userRole === 'admin' || userRole === 'staff') && (
                                    <NavButton active={view === 'upload'} onClick={() => setView('upload')} icon={<UploadCloud size={18} />} label="Data" />
                                )}
                                <NavButton active={view === 'alerts'} onClick={() => setView('alerts')} icon={<Bell size={18} />} label="Alerts" />
                            </nav>
                            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{userRole}</p>
                                    <p className="text-xs text-slate-400 truncate max-w-[120px]">{session.user.email}</p>
                                </div>
                                <button onClick={handleLogout} className="p-2 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-rose-400 transition-colors group">
                                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div className="relative z-10 w-full h-full flex flex-col pt-20 overflow-hidden">
                <AnimatePresence mode="wait">
                    {view === 'landing' && (
                        <motion.main key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col md:flex-row">
                            <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-24">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan-500/30 bg-cyan-500/10 rounded-full backdrop-blur-md">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Autonomous Agentic AI</span>
                                    </div>
                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white">Predicting <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Hospital Capacity</span></h1>
                                    <p className="text-base md:text-lg text-slate-400 max-w-lg leading-relaxed">An intelligent multi-agent system designed to forecast bed availability, optimize workflows, and save lives.</p>
                                    <div className="flex flex-wrap gap-4 pt-4">
                                        <button onClick={() => setView('login')} className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-cyan-50 transition-all flex items-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)]">RESERVE ACCESS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
                                        <button onClick={() => handleGuestLogin('staff')} className="px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all text-gray-300 text-sm font-bold backdrop-blur-sm">VIEW DEMO</button>
                                    </div>
                                </div>
                            </div>
                        </motion.main>
                    )}

                    {view === 'login' && <div key="login" className="w-full h-full flex items-center justify-center p-4 md:p-8 overflow-y-auto"><Login onBack={() => setView('landing')} onSignUpMode={() => setView('signup')} onDemoLogin={handleGuestLogin} /></div>}
                    {view === 'signup' && <div key="signup" className="w-full h-full flex items-center justify-center p-4 md:p-8 overflow-y-auto"><SignUp onBack={() => setView('landing')} onLoginMode={() => setView('login')} /></div>}

                    {(view === 'dashboard' || view === 'predictions' || view === 'upload' || view === 'alerts') && (
                        <motion.div key="app-shell" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full flex flex-col overflow-hidden bg-white/[0.01]">
                            <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
                                {view === 'dashboard' && <HospitalDashboard userRole={userRole} setView={setView} />}
                                {view === 'predictions' && <Predictions />}
                                {view === 'upload' && <DataUpload />}
                                {view === 'alerts' && <Alerts />}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

const NavButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-2 text-xs font-bold transition-all px-4 py-2 rounded-xl relative ${active ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
        {icon}
        <span>{label.toUpperCase()}</span>
        {active && <motion.div layoutId="activeNav" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
    </button>
)

export default App
