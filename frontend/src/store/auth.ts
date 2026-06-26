import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useSession } from './session';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, loading: false });

    if (data.session?.user) await useSession.getState().load();
    else useSession.setState({ loading: false });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) useSession.getState().load();
      } else if (event === 'SIGNED_OUT') {
        useSession.getState().clear();
      }
    });
  },

  signOut: async () => {
    try { await supabase.auth.signOut(); } catch { /* clear local state regardless */ }
    useSession.getState().clear();
    set({ session: null, user: null });
  },
}));
