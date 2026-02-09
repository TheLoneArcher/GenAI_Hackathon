import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function SupabaseDemo() {
    const [status, setStatus] = useState('idle') // idle, loading, success, error
    const [count, setCount] = useState(0)

    useEffect(() => {
        async function checkConnection() {
            setStatus('loading')
            try {
                // Attempt to fetch, but handle the 404 (table not found) specifically 
                const { data, error } = await supabase.from('todos').select('count', { count: 'exact', head: true })

                if (error) {
                    // If the table doesn't exist, it will likely return a specific code or message
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        console.warn("Supabase 'todos' table not found. Skipping demo display.")
                        setStatus('idle') // Just hide it/stay idle
                        return
                    }
                    throw error
                }

                setCount(data?.length || 0) // Just showing count for minimal UI
                setStatus('success')

            } catch (err) {
                console.error("Supabase connection check failed:", err.message)
                setStatus('error')
            }
        }

        checkConnection()
    }, [])

    if (status === 'error' || status === 'idle') return null; // Don't show anything on error or if table missing

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-400 tracking-wide">
                Database Connected
            </span>
        </div>
    )
}
