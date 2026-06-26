import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';
import type { Action, Module } from '@/lib/permissions';
import { can } from '@/lib/permissions';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const sessionLoading = useSession((s) => s.loading);

  if (loading || (user && sessionLoading)) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
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
