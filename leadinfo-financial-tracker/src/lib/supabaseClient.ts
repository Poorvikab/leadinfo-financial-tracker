import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error('Supabase environment variables are missing.');
}

// ─── In-memory storage — no localStorage, no sessionStorage ──────────────────
const memoryStore: Record<string, string> = {};

const memoryStorageAdapter = {
  getItem: (key: string): string | null => memoryStore[key] ?? null,
  setItem: (key: string, value: string): void => { memoryStore[key] = value; },
  removeItem: (key: string): void => { delete memoryStore[key]; },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: memoryStorageAdapter,
    persistSession: true,      // survives re-renders, gone on tab close/refresh
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});