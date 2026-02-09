import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { Scene } from './components/Scene'
import { StarField } from './components/StarField'
import { Login } from './components/Login'
import { SignUp } from './components/SignUp'
import { supabase } from './utils/supabase'
import { ArrowRight, Bot, Zap, Shield, Atom, LayoutDashboard, LogOut, User } from 'lucide-react'

function App() {
    const [session, setSession] = useState(null)
    const [view, setView] = useState('landing') // landing, login, signup

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session) setView('landing') // Jump back to landing (which will show dashboard) if logged in
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleGuestLogin = () => {
        setSession({
            user: { email: 'guest@nexus.ai', is_anonymous: true }
        })
    }

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (!error) setSession(null)
    }

    return (
        <div className="w-full h-screen bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">

            {/* GLOBAL BACKGROUND STARS */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <Canvas camera={{ position: [0, 0, 1], fov: 100 }}>
                    <StarField count={800} />
                </Canvas>
            </div>

            {/* GLOBAL HEADER */}
            <header className="absolute top-0 left-0 w-full z-50 h-20 px-6 md:px-12 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto cursor-pointer" onClick={() => setView('landing')}>
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-md">
                        <Atom className="w-6 h-6 text-cyan-400" />
                    </div>
                    <span className="text-xl font-mono tracking-wider font-bold text-gray-200 drop-shadow-lg">
                        NEXUS_AI
                    </span>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    {!session ? (
                        <>
                            <button
                                onClick={handleGuestLogin}
                                className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                <User className="w-4 h-4" />
                                GUEST
                            </button>
                            <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                            <button
                                onClick={() => setView('login')}
                                className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => setView('signup')}
                                className="px-5 py-2 rounded bg-white text-black text-xs font-bold hover:bg-cyan-50 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            >
                                SIGN UP
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="hidden md:block text-xs font-mono text-cyan-400">{session.user.email}</span>
                            <button onClick={handleLogout} className="p-2 bg-white/5 rounded-full border border-white/10 text-slate-400 hover:text-red-400 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Dynamic View Section */}
            <div className="relative z-10 w-full h-full flex flex-col md:flex-row pt-20">

                {/* Main Content Area */}
                <main className="w-full md:w-1/2 h-[55%] md:h-full flex flex-col justify-between px-6 md:px-12 py-6 order-2 md:order-1">

                    <div className="flex flex-col justify-center items-start flex-grow">
                        <AnimatePresence mode="wait">
                            {view === 'landing' && (
                                <motion.div
                                    key="landing"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {!session ? (
                                        /* LANDING HERO */
                                        <>
                                            <div className="inline-block px-3 py-1 mb-4 border-l-2 border-cyan-400 bg-cyan-900/10 backdrop-blur-sm">
                                                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">System Operational</span>
                                            </div>
                                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight drop-shadow-2xl">
                                                INTELLIGENT. <br />
                                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-white to-cyan-400 animate-gradient">
                                                    AUTONOMOUS.
                                                </span>
                                            </h1>
                                            <p className="text-base md:text-lg text-slate-400 max-w-lg leading-relaxed">
                                                Enterprise-grade neural architecture. Zero latency. Infinite scalability.
                                            </p>
                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    onClick={() => setView('login')}
                                                    className="px-8 py-4 rounded bg-white text-black font-bold text-sm hover:bg-cyan-50 transition-all flex items-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                                >
                                                    GET STARTED
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={handleGuestLogin}
                                                    className="px-8 py-4 rounded border border-white/10 hover:bg-white/5 transition-all text-gray-300 text-sm font-bold backdrop-blur-sm"
                                                >
                                                    TRY DEMO
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        /* DASHBOARD VIEW */
                                        <div className="w-full max-w-lg bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
                                            <h2 className="text-3xl font-bold text-white mb-2">Welcome, {session.user.is_anonymous ? 'Guest' : 'User'}!</h2>
                                            <p className="text-cyan-400 font-mono text-xs mb-8 break-all">{session.user.email}</p>

                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">API Status</div>
                                                    <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        ACTIVE
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Neural Load</div>
                                                    <div className="text-lg font-bold text-white">12.4%</div>
                                                </div>
                                            </div>

                                            <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-cyan-50 transition-all flex items-center justify-center gap-2">
                                                <LayoutDashboard className="w-4 h-4" />
                                                OPEN DASHBOARD
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {view === 'login' && (
                                <Login
                                    key="login"
                                    onBack={() => setView('landing')}
                                    onSignUpMode={() => setView('signup')}
                                />
                            )}

                            {view === 'signup' && (
                                <SignUp
                                    key="signup"
                                    onBack={() => setView('landing')}
                                    onLoginMode={() => setView('login')}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Features (Only show on landing) */}
                    {view === 'landing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="w-full pt-4 border-t border-white/10 mt-auto backdrop-blur-sm"
                        >
                            <div className="grid grid-cols-3 gap-2 md:gap-4">
                                <div className="text-left">
                                    <Zap className="w-4 h-4 text-cyan-500 mb-2" />
                                    <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Real-time</h3>
                                    <p className="hidden md:block text-[10px] text-gray-500 mt-1">&lt;1ms latency</p>
                                </div>
                                <div className="text-left">
                                    <Shield className="w-4 h-4 text-cyan-500 mb-2" />
                                    <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Secure</h3>
                                    <p className="hidden md:block text-[10px] text-gray-500 mt-1">End-to-end Encrypted</p>
                                </div>
                                <div className="text-left">
                                    <Bot className="w-4 h-4 text-cyan-500 mb-2" />
                                    <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Adaptive</h3>
                                    <p className="hidden md:block text-[10px] text-gray-500 mt-1">Self-healing models</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </main>

                {/* RIGHT SIDE: 3D Canvas */}
                <div className="relative w-full md:w-1/2 h-[45%] md:h-full order-1 md:order-2">
                    <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                        <Scene />
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                    </Canvas>
                </div>
            </div>
        </div>
    )
}

export default App
