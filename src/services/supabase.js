import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase strips the auth hash when `detectSessionInUrl` runs. Capture `type` first so
 * we can tell invite/signup callbacks from password recovery (both may emit PASSWORD_RECOVERY).
 */
let initialAuthHashType = '';
let initialAuthQueryType = '';
try {
  if (typeof window !== 'undefined') {
    const raw = (window.location.hash || '').replace(/^#/, '');
    if (raw) {
      initialAuthHashType = (new URLSearchParams(raw).get('type') || '').toLowerCase();
    }
    initialAuthQueryType = (
      new URLSearchParams(window.location.search).get('type') || ''
    ).toLowerCase();
  }
} catch {
  initialAuthHashType = '';
  initialAuthQueryType = '';
}

export function getInitialSupabaseAuthHashType() {
  return initialAuthHashType;
}

export function getInitialSupabaseAuthQueryType() {
  return initialAuthQueryType;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // After Supabase invite/signup redirects back, tokens may be present in the URL.
    // This ensures our SPA picks them up and sets `session` accordingly.
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});



