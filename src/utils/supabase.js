import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Fail gracefully instead of crashing the app if env vars are missing
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : {
        from: () => ({
            select: async () => ({ data: null, error: new Error("Supabase credentials missing. Check .env file.") })
        })
    };
