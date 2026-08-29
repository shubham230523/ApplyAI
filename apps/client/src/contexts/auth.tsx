import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'candidate' | 'recruiter';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    const fetchTrueRole = async (session: Session) => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        console.log('Verifying true role from backend...');
        const response = await fetch(`${apiUrl}/api/profile`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          const profile = await response.json();
          if (profile && profile.role) {
            console.log('Verified True Role from DB:', profile.role);
            setRole(profile.role as UserRole);
          }
        }
      } catch (e) {
        console.error('Failed to verify true role from backend:', e);
      } finally {
        setHasVerified(true);
        setVerifying(false);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        const metadataRole = (session.user.user_metadata?.role as UserRole) ?? null;
        setRole(metadataRole);
        setVerifying(true);
        fetchTrueRole(session);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] State Change Event: ${event}`);

      // Focus/Token Refresh Stability:
      // If the user ID hasn't changed and we are already verified, just update the session object
      // without triggering a global "loading" state. This prevents UI flashes on tab switch.
      if (session?.user.id === user?.id && hasVerified && (event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
        console.log('[Auth] Stable session update - skipping re-verification');
        setSession(session);
        return;
      }

      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);

      if (session) {
        const userRole = (session.user.user_metadata?.role as UserRole) ?? null;
        if (!hasVerified) {
          setRole(userRole);
        }
        setVerifying(true);
        fetchTrueRole(session);
      } else {
        setRole(null);
        setHasVerified(false);
        setVerifying(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading: loading || (verifying && !hasVerified), signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
