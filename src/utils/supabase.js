import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Fail gracefully instead of crashing the app if env vars are missing
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : {
        from: () => ({
            select: () => ({ order: () => ({ limit: () => ({ execute: async () => ({ data: [], error: null }), single: async () => ({ data: null, error: null }) }) }) }),
            insert: () => ({ execute: async () => ({ data: [], error: null }) }),
            upsert: () => ({ execute: async () => ({ data: [], error: null }) }),
            update: () => ({ eq: () => ({ execute: async () => ({ data: [], error: null }) }) }),
        }),
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signOut: async () => ({ error: null }),
            signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
            signUp: async () => ({ data: { user: null, session: null }, error: null }),
        },
        channel: () => ({
            on: () => ({ on: () => ({ on: () => ({ subscribe: () => { } }) }) }),
            subscribe: () => { },
        }),
        removeChannel: () => { },
    };
