import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { Mail, Lock, ArrowLeft, Loader2, UserPlus, CheckCircle2 } from 'lucide-react'

export function SignUp({ onBack, onLoginMode }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })
            if (error) throw error

            // Create user profile as Patient by default
            if (data.user) {
                await supabase.from('profiles').upsert([
                    { id: data.user.id, role: 'patient', full_name: email.split('@')[0] }
                ]);
            }

            setSuccess(true)
            setMessage('Identity registered. Access initialized with Patient role.')
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#0f172a]/90 border border-emerald-500/30 p-12 rounded-[2.5rem] backdrop-blur-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.1)]"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-emerald-500/20 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                    Your digital identity is being initialized. You will have <span className="text-emerald-400 font-bold uppercase tracking-widest">Patient</span> access by default.
                </p>
                <button
                    onClick={onLoginMode}
                    className="w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                >
                    PROCEED TO PORTAL
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-[#020617]/90 border-2 border-cyan-500/30 p-10 md:p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-[0_0_80px_rgba(6,182,212,0.15)] relative overflow-hidden"
        >
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Return to Landing
            </button>

            <h2 className="text-3xl font-bold text-white mb-2">Join System</h2>
            <p className="text-slate-400 mb-8 text-sm">New users are assigned <span className="text-cyan-400 font-bold">Patient</span> status.</p>

            <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest ml-1">Email Identity</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:border-cyan-400/50 transition-all focus:bg-white/[0.07]"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest ml-1">Credential Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="password"
                            placeholder="min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:border-cyan-400/50 transition-all focus:bg-white/[0.07]"
                            minLength={6}
                            required
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-cyan-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                REGISTER ACCOUNT
                            </>
                        )}
                    </button>
                    <p className="text-[9px] text-center text-slate-500 mt-4 uppercase tracking-widest font-bold">
                        By joining, you agree to biometric monitoring protocols.
                    </p>
                </div>
            </form>

            {message && <p className="text-[10px] text-center mt-6 text-red-400 bg-red-400/5 p-3 rounded-xl border border-red-400/20">{message}</p>}

            <p className="text-center text-xs text-slate-500 mt-10">
                Already registered?
                <button onClick={onLoginMode} className="text-cyan-400 hover:underline ml-2 font-bold">Initialize Portal</button>
            </p>
        </motion.div>
    )
}
