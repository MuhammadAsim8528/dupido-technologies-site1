import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Subscription } from '../lib/types';
import type { User, Session } from '@supabase/supabase-js';

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'protonmail.com', 'proton.me', 'mail.com', 'zoho.com',
  'yandex.com', 'gmx.com', 'live.com', 'msn.com', 'me.com', 'mac.com',
  'inbox.com', 'qq.com', '163.com', '126.com',
];

export function classifyEmail(email: string): { type: 'personal' | 'work'; suggestedPlan: Subscription['plan'] } {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { type: 'personal', suggestedPlan: 'free' };
  if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
    return { type: 'personal', suggestedPlan: 'free' };
  }
  return { type: 'work', suggestedPlan: 'pro' };
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  verifyEmail: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data as Profile);
  }, []);

  const fetchSubscription = useCallback(async (userId: string) => {
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();
    if (data) setSubscription(data as Subscription);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchSubscription(user.id);
    }
  }, [user, fetchProfile, fetchSubscription]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const verifyEmail = useCallback(async () => {
    if (!user) return;
    await supabase.from('profiles').update({ email_verified: true }).eq('id', user.id);
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    if (!user) return;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await supabase.from('verification_otps').insert({
      user_id: user.id,
      type: 'phone',
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    await supabase.from('profiles').update({ phone }).eq('id', user.id);
  }, [user]);

  const verifyPhoneOtp = useCallback(async (code: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('verification_otps')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'phone')
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) throw new Error('Invalid or expired code');
    await supabase.from('verification_otps').update({ verified: true }).eq('id', data[0].id);
    await supabase.from('profiles').update({ phone_verified: true }).eq('id', user.id);
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
        fetchSubscription(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id);
          fetchSubscription(s.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
      }
    );

    return () => sub.unsubscribe();
  }, [fetchProfile, fetchSubscription]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      // Email classification: auto-assign plan based on email domain
      const { suggestedPlan } = classifyEmail(email);

      await supabase.from('profiles').insert({
        id: userData.user.id,
        email,
        full_name: fullName,
        email_verified: false,
        phone_verified: false,
        two_factor_enabled: false,
      });
      await supabase.from('subscriptions').insert({
        user_id: userData.user.id,
        plan: suggestedPlan,
        status: 'active',
        usage_limit: suggestedPlan === 'pro' ? 50000 : suggestedPlan === 'starter' ? 5000 : 100,
        usage_used: 0,
      });
      await supabase.from('security_logs').insert({
        user_id: userData.user.id,
        action: 'account_created',
        details: { email, email_type: classifyEmail(email).type, assigned_plan: suggestedPlan },
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = window.location.hostname === 'localhost'
        ? `${window.location.origin}/auth/callback`
        : `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        console.error('[Google OAuth] Initialization error:', error.message);
        throw error;
      }
    } catch (err) {
      console.error('[Google OAuth] Caught error during sign-in:', err);
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, subscription, session, loading,
      signUp, signIn, signInWithGoogle, signOut, refreshProfile, updateProfile,
      verifyEmail, sendPhoneOtp, verifyPhoneOtp,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
