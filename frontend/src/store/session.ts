import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Action, Module, Role } from '@/lib/permissions';
import { can as canFn } from '@/lib/permissions';

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  status: 'active' | 'inactive';
  theme?: string;
}

interface SessionState {
  user: AppUser | null;
  role: Role | null;
  loading: boolean;
  error: boolean;
  load: () => Promise<void>;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  role: null,
  loading: true,
  error: false,

  load: async () => {
    set({ loading: true, error: false });
    try {
      const res = await api.get<{ user: AppUser; role: Role }>('/auth/me');
      set({ user: res.user, role: res.role, loading: false, error: false });
    } catch {
      set({ user: null, role: null, loading: false, error: true });
    }
  },

  clear: () => set({ user: null, role: null, error: false }),
}));

// ── selectors / helpers ──────────────────────────────────────────────────────
export const useRole = (): Role | null => useSession((s) => s.role);
export const useCan = (module: Module, action: Action): boolean =>
  useSession((s) => canFn(s.role, module, action));
