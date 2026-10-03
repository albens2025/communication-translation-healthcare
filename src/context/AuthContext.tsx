import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ensureProfile, fetchMyProfile, errMsg } from '@/lib/api';
import { roleById, type RoleDef } from '@/data/constants';
import type { Role, UserProfile } from '@/lib/types';

type AuthMode = 'signin' | 'signup';

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  roleDef: RoleDef | undefined;
  loading: boolean;
  authOpen: boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (args: { email: string; password: string; fullName: string; role: Role }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  // Load (or lazily create) the user_profiles row for the signed-in user.
  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) { setProfile(null); return; }
    try {
      let p = await fetchMyProfile(u.id);
      if (!p) {
        const meta = (u.user_metadata ?? {}) as { role?: Role; full_name?: string };
        p = await ensureProfile(meta.role ?? 'patient', meta.full_name ?? '', u.email ?? '');
      }
      setProfile(p);
    } catch (e) {
      console.error('Profile load failed', e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      if (!mounted) return;
      setUser(u);
      await loadProfile(u);
      if (mounted) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      // Defer DB calls out of the auth callback to avoid client lock contention.
      setTimeout(() => { loadProfile(u).finally(() => setLoading(false)); }, 0);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async ({ email, password, fullName, role }: { email: string; password: string; fullName: string; role: Role }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) throw new Error(error.message);
    if (data.session?.user) {
      try {
        const p = await ensureProfile(role, fullName, email);
        setProfile(p);
      } catch (e) {
        throw new Error(errMsg(e));
      }
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
  };

  const value = useMemo<AuthCtx>(() => ({
    user, profile, roleDef: roleById(profile?.role), loading, authOpen, authMode,
    openAuth: (mode = 'signin') => { setAuthMode(mode); setAuthOpen(true); },
    closeAuth: () => setAuthOpen(false),
    signIn, signUp, signOut,
    reloadProfile: () => loadProfile(user),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, profile, loading, authOpen, authMode, loadProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};
