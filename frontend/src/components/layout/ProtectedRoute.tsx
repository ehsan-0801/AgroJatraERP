import { Navigate } from 'react-router-dom';
import { BrandSplash } from '@/components/Loader';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';
import type { Action, Module } from '@/lib/permissions';
import { can } from '@/lib/permissions';

/** Guards the authenticated app: requires login + an active organization.
 *  Routes users without an org to onboarding, and super admins to /admin. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const s = useSession();

  if (loading || (user && s.loading)) return <BrandSplash label="Loading your workspace" />;
  if (!user) return <Navigate to="/login" replace />;
  if (s.error) return <>{children}</>; // AppLayout shows a retry screen
  if (s.needsOnboarding) return <Navigate to="/onboarding" replace />;
  if (!s.activeOrgId) return <Navigate to={s.isSuperAdmin ? '/admin' : '/onboarding'} replace />;
  return <>{children}</>;
}

/** Onboarding screen guard: requires login, sends already-onboarded users away. */
export function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const s = useSession();
  if (loading || (user && s.loading)) return <BrandSplash label="Loading" />;
  if (!user) return <Navigate to="/login" replace />;
  if (s.isSuperAdmin) return <Navigate to="/admin" replace />;
  if (s.activeOrgId) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Super-admin console guard. */
export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const s = useSession();
  if (loading || (user && s.loading)) return <BrandSplash label="Loading" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!s.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Guards a route by the permission matrix; redirects to dashboard if denied. */
export function RequirePermission({ module, action = 'read', children }: { module: Module; action?: Action; children: React.ReactNode }) {
  const role = useSession((s) => s.role);
  const loading = useSession((s) => s.loading);
  if (loading) return null;
  if (!can(role, module, action)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
