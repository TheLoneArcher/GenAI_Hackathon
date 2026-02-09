import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react'

export function Login({ onBack, onSignUpMode }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [useMagicLink, setUseMagicLink] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md bg-black/40 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 md:mb-6 text-sm group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Welcome Back</h2>
            <p className="text-slate-400 mb-6 md:mb-8 text-sm">Please enter your details to sign in.</p>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                            required
                        />
                    </div>
                </div>

                {!useMagicLink && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center px-1">
                    <button
                        type="button"
                        onClick={() => setUseMagicLink(!useMagicLink)}
                        className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-colors uppercase"
                    >
                        {useMagicLink ? 'Use Password' : 'Use Magic Link'}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-2.5 mt-2 rounded-xl hover:bg-cyan-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SIGN IN'}
                </button>
            </form>

            {message && <p className="text-[10px] text-center mt-3 text-cyan-400 bg-cyan-400/5 p-2 rounded border border-cyan-400/20">{message}</p>}

            <p className="text-center text-xs text-slate-500 mt-8">
                New here?
                <button onClick={onSignUpMode} className="text-cyan-400 hover:underline ml-1">Create account</button>
            </p>
        </motion.div>
    )
}
