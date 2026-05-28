import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithSupabase: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithSupabase: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app load, check Supabase session and keep in sync
  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error getting Supabase session', error);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const session = data.session;
      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email ?? '',
          name: (u.user_metadata && (u.user_metadata.full_name as string)) || null,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);

      // Listen for future auth changes and verify user still exists
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          // Verify the user still exists in the database (catch deleted users immediately)
          const { data: userData, error } = await supabase.auth.getUser();
          if (error || !userData.user) {
            // User was deleted from database, clear everything and logout
            await supabase.auth.signOut();
            setUser(null);
            localStorage.clear();
            window.location.href = '/login';
          } else {
            const u = newSession.user;
            setUser({
              id: u.id,
              email: u.email ?? '',
              name: (u.user_metadata && (u.user_metadata.full_name as string)) || null,
            });
          }
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    void init();
  }, []);

  // Polling and event listeners to detect deleted users in real-time
  useEffect(() => {
    if (!user) return; // Only check if user exists

    let lastChecked = 0;
    const CHECK_THROTTLE_MS = 2000; // Limit checks to at most once every 2 seconds

    const checkUserExists = async () => {
      const now = Date.now();
      if (now - lastChecked < CHECK_THROTTLE_MS) return;
      lastChecked = now;

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          // User was deleted, clear everything and logout
          await supabase.auth.signOut();
          setUser(null);
          // Clear all localStorage to ensure no cached session persists
          localStorage.clear();
          // Redirect to login immediately
          window.location.href = '/login';
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error verifying user:', err);
      }
    };

    // 1. Check periodically every 3 seconds
    const interval = setInterval(checkUserExists, 3000);

    // 2. Check when the window/tab gets focus
    const handleFocus = () => {
      void checkUserExists();
    };

    // 3. Check when the tab visibility changes to visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkUserExists();
      }
    };

    // 4. Check on user interaction (clicks)
    const handleInteraction = () => {
      void checkUserExists();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('click', handleInteraction);

    // Initial check on mount/user change
    void checkUserExists();

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('click', handleInteraction);
    };
  }, [user]);

  const loginWithSupabase = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { ok: false, error: 'No account exists please make a new one.' };
    }

    const u = data.user;
    if (u) {
      setUser({
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata && (u.user_metadata.full_name as string)) || null,
      });
    }

    return { ok: true };
  };

  const signUpWithSupabase = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      // If the user already exists, signal this so the UI can redirect to login
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        return { ok: false, error: 'USER_ALREADY_EXISTS' };
      }
      return { ok: false, error: error.message };
    }

    const u = data.user;
    if (u) {
      setUser({
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata && (u.user_metadata.full_name as string)) || null,
      });
    }

    return { ok: true };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error signing out', error);
    }
    setUser(null);
    // Clear all cached data including Supabase session
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithSupabase,
        signUpWithSupabase,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
