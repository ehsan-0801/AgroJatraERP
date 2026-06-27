import { create } from 'zustand';
import { api, getActiveOrg, setActiveOrgId } from '@/lib/api';
import type { Action, Module, Role } from '@/lib/permissions';
import { can as canFn } from '@/lib/permissions';

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  theme?: string;
  is_super_admin?: boolean;
}

export interface Membership {
  organization_id: string;
  organization_name: string;
  role: Role;
}

interface MeResponse {
  user: AppUser;
  memberships: Membership[];
  activeOrgId: string | null;
  role: Role | null;
  isSuperAdmin: boolean;
  needsOnboarding: boolean;
}

interface SessionState {
  user: AppUser | null;
  role: Role | null;
  memberships: Membership[];
  activeOrgId: string | null;
  isSuperAdmin: boolean;
  needsOnboarding: boolean;
  loading: boolean;
  error: boolean;
  load: () => Promise<void>;
  setActiveOrg: (orgId: string) => Promise<void>;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  role: null,
  memberships: [],
  activeOrgId: null,
  isSuperAdmin: false,
  needsOnboarding: false,
  loading: true,
  error: false,

  load: async () => {
    set({ loading: true, error: false });
    try {
      const res = await api.get<MeResponse>('/auth/me');
      // keep the persisted active-org header in sync with the server's choice
      if (res.activeOrgId && getActiveOrg() !== res.activeOrgId) setActiveOrgId(res.activeOrgId);
      if (!res.activeOrgId) setActiveOrgId(null);
      set({
        user: res.user,
        role: res.role,
        memberships: res.memberships ?? [],
        activeOrgId: res.activeOrgId,
        isSuperAdmin: res.isSuperAdmin,
        needsOnboarding: res.needsOnboarding,
        loading: false,
        error: false,
      });
    } catch {
      set({ user: null, role: null, memberships: [], activeOrgId: null, isSuperAdmin: false, needsOnboarding: false, loading: false, error: true });
    }
  },

  setActiveOrg: async (orgId: string) => {
    setActiveOrgId(orgId);
    set({ activeOrgId: orgId });
    await useSession.getState().load();
  },

  clear: () => {
    setActiveOrgId(null);
    set({ user: null, role: null, memberships: [], activeOrgId: null, isSuperAdmin: false, needsOnboarding: false, error: false });
  },
}));

// ── selectors / helpers ──────────────────────────────────────────────────────
export const useRole = (): Role | null => useSession((s) => s.role);
export const useCan = (module: Module, action: Action): boolean =>
  useSession((s) => canFn(s.role, module, action));
