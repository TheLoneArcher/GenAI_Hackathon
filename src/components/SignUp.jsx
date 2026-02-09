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
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })
            if (error) throw error
            setSuccess(true)
            setMessage('Identity registered. check your email to verify.')
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
                className="w-full max-w-md bg-black/40 border border-white/10 p-12 rounded-3xl backdrop-blur-2xl text-center"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-emerald-500/20 rounded-full">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Verification Sent</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    A secure transmission has been sent to <span className="text-cyan-400 font-mono">{email}</span>. Please verify your link to finalize identity creation.
                </p>
                <button
                    onClick={onLoginMode}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    RETURN TO PORTAL
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md bg-black/40 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl"
        >
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 md:mb-6 text-sm group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Return
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Create Account</h2>
            <p className="text-slate-400 mb-6 md:mb-8 text-sm">Join the next evolution of AI.</p>

            <form onSubmit={handleSignUp} className="space-y-4">
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

                <div className="space-y-1">
                    <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="password"
                            placeholder="min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                            minLength={6}
                            required
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-500 text-black font-bold py-2.5 rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                SIGN UP
                            </>
                        )}
                    </button>
                </div>
            </form>

            {message && <p className="text-[10px] text-center mt-4 text-red-400 bg-red-400/5 p-2 rounded border border-red-400/20">{message}</p>}

            <p className="text-center text-xs text-slate-500 mt-8">
                Registered already?
                <button onClick={onLoginMode} className="text-cyan-400 hover:underline ml-1">Sign In</button>
            </p>
        </motion.div>
    )
}
