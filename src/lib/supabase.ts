import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Don't throw — let the app boot without env so the landing page works
  // before Supabase is configured. Auth-gated routes will surface this.
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. Auth + data features will fail until set.',
  );
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabaseConfigured = Boolean(url && anonKey);
