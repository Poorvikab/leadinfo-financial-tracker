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

      // Listen for future auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession?.user) {
          const u = newSession.user;
          setUser({
            id: u.id,
            email: u.email ?? '',
            name: (u.user_metadata && (u.user_metadata.full_name as string)) || null,
          });
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

  const loginWithSupabase = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { ok: false, error: 'Invalid email or password.' };
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
