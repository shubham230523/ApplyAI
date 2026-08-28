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
      if (hasVerified) {
        setVerifying(false);
        return;
      }
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
      // setVerifying is now handled by the caller to avoid state gaps
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
            setHasVerified(true);
          }
        }
      } catch (e) {
        console.error('Failed to verify true role from backend:', e);
      } finally {
        setVerifying(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        const metadataRole = (session.user.user_metadata?.role as UserRole) ?? null;
        setRole(metadataRole);
        // Start verification before setting loading to false
        setVerifying(true);
        fetchTrueRole(session);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      }
      setLoading(false);
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
