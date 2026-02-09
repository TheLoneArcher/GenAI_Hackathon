import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react'

export function Login({ onBack, onSignUpMode, onDemoLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [useMagicLink, setUseMagicLink] = useState(false)

    const handleLogin = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            let error;
            if (useMagicLink) {
                ({ error } = await supabase.auth.signInWithOtp({ email }))
                if (!error) setMessage('Check your email for the magic link!')
            } else {
                ({ error } = await supabase.auth.signInWithPassword({ email, password }))
            }
            if (error) throw error
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-[#020617]/90 border-2 border-cyan-500/30 p-8 rounded-[2rem] backdrop-blur-3xl shadow-[0_0_80px_rgba(6,182,212,0.15)] relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-xs group">
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                Back to Welcome
            </button>

            <h2 className="text-2xl font-bold text-white mb-1">Access Portal</h2>
            <p className="text-slate-400 mb-6 text-xs">Secure biometric verification required.</p>

            <div className="space-y-4">
                {/* DEMO PROFILES SECTION */}
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Demo Access</label>
                    <div className="grid grid-cols-3 gap-2">
                        <DemoButton label="Admin" onClick={() => onDemoLogin('Admin')} color="rose" />
                        <DemoButton label="Staff" onClick={() => onDemoLogin('Staff')} color="cyan" />
                        <DemoButton label="Patient" onClick={() => onDemoLogin('Patient')} color="emerald" />
                    </div>
                </div>

                <div className="relative flex items-center gap-4 py-1">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest ml-1">System Identifier</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="email"
                                placeholder="name@hospital.ai"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 transition-all focus:bg-white/[0.07]"
                                required
                            />
                        </div>
                    </div>

                    {!useMagicLink && (
                        <div className="space-y-1">
                            <label className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest ml-1">Encryption Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 transition-all focus:bg-white/[0.07]"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-0">
                        <button
                            type="button"
                            onClick={() => setUseMagicLink(!useMagicLink)}
                            className="text-[9px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-wider"
                        >
                            {useMagicLink ? 'Back to password' : 'Forgot key?'}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-500 text-black font-bold py-3 mt-1 rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-[0_10px_30px_rgba(6,182,212,0.2)] text-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'INITIALIZE SESSION'}
                    </button>
                </form>
            </div>

            {message && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] text-center mt-4 text-cyan-400 bg-cyan-400/5 p-2 rounded-lg border border-cyan-400/20"
                >
                    {message}
                </motion.p>
            )}

            <p className="text-center text-[10px] text-slate-500 mt-6">
                New to the system?
                <button onClick={onSignUpMode} className="text-cyan-400 hover:underline ml-1 font-bold">Register Identity</button>
            </p>
        </motion.div>
    )
}

const DemoButton = ({ label, onClick, color }) => (
    <button
        onClick={onClick}
        className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all
            ${color === 'rose' ? 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10' :
                color === 'cyan' ? 'border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10' :
                    'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'}`}
    >
        {label.toUpperCase()}
    </button>
)
