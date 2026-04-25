import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase environment variables are missing.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,        // persists session across refreshes
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Hits the Supabase server to verify the user still exists and is valid.
 * Unlike getSession(), getUser() always makes a network call — so deleted
 * or revoked users are caught immediately.
 */
export async function validateSessionOnLoad(): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await supabase.auth.signOut();
  }
}

/**
 * Re-validates every 3 minutes while the tab is open.
 * Returns a cleanup function — call it to stop the watchdog.
 */
export function startSessionWatchdog(): () => void {
  const INTERVAL_MS = 3 * 60 * 1000;

  const id = setInterval(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  }, INTERVAL_MS);

  return () => clearInterval(id);
}