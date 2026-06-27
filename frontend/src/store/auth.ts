import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useSession } from './session';

// Tracks which user the app-session was last loaded for, so repeated auth
// events (token refresh, tab refocus) for the same user don't trigger reloads.
let loadedUserId: string | null = null;

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

    if (data.session?.user) { await useSession.getState().load(); loadedUserId = data.session.user.id; }
    else useSession.setState({ loading: false });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });
      const uid = session?.user?.id ?? null;
      if (event === 'SIGNED_OUT' || !uid) {
        loadedUserId = null;
        useSession.getState().clear();
      } else if (uid !== loadedUserId) {
        // A genuinely new user signed in → full load (shows splash once).
        loadedUserId = uid;
        useSession.getState().load();
      }
      // TOKEN_REFRESHED / tab-refocus for the same user → do nothing, so the
      // app doesn't flash the loader every time you switch tabs.
    });
  },

  signOut: async () => {
    try { await supabase.auth.signOut(); } catch { /* clear local state regardless */ }
    loadedUserId = null;
    useSession.getState().clear();
    set({ session: null, user: null });
  },
}));
