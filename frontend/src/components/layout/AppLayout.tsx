import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, Boxes, Building2, Calculator, FileBarChart, Home, LayoutDashboard, LogOut, Moon, Settings,
  ShieldCheck, ShoppingCart, Sun, Tags, Truck, UserCircle, Users, UsersRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatePresence, PageTransition } from '@/components/motion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { can, type Module } from '@/lib/permissions';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';
import { useTheme } from '@/store/theme';

interface NavItem { to: string; labelKey: string; icon: typeof LayoutDashboard; module: Module; end?: boolean }
interface NavGroup { groupKey?: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { items: [{ to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, module: 'dashboard', end: true }] },
  { groupKey: 'inventory', items: [
    { to: '/products', labelKey: 'products', icon: Boxes, module: 'products' },
    { to: '/categories', labelKey: 'categories', icon: Tags, module: 'categories' },
  ] },
  { groupKey: 'crm', items: [
    { to: '/customers', labelKey: 'customers', icon: Users, module: 'customers' },
    { to: '/suppliers', labelKey: 'suppliers', icon: Truck, module: 'suppliers' },
  ] },
  { groupKey: 'transactions', items: [
    { to: '/purchases', labelKey: 'purchases', icon: ShoppingCart, module: 'purchases' },
    { to: '/sales', labelKey: 'sales', icon: BarChart3, module: 'sales' },
  ] },
  { groupKey: 'insights', items: [
    { to: '/reports', labelKey: 'reports', icon: FileBarChart, module: 'reports' },
    { to: '/accounts', labelKey: 'accounts', icon: Calculator, module: 'accounts' },
  ] },
  { groupKey: 'administration', items: [
    { to: '/users', labelKey: 'users', icon: UsersRound, module: 'users' },
    { to: '/roles', labelKey: 'roles', icon: ShieldCheck, module: 'users' },
    { to: '/settings', labelKey: 'settings', icon: Settings, module: 'settings' },
  ] },
];

export function AppLayout() {
  const { user: authUser, signOut } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const memberships = useSession((s) => s.memberships);
  const activeOrgId = useSession((s) => s.activeOrgId);
  const setActiveOrg = useSession((s) => s.setActiveOrg);
  const sessionError = useSession((s) => s.error);
  const reload = useSession((s) => s.load);
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const handleSignOut = async () => {
    await signOut();
    qc.clear();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <Building2 className="h-10 w-10 text-destructive" />
        <div>
          <h1 className="text-lg font-semibold">Couldn't load your workspace</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {sessionError
              ? 'Couldn’t reach the API server. Make sure the backend is running on http://localhost:4000, then retry.'
              : 'Loading your session…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => reload()}>{t('common.retry')}</Button>
          <Button variant="outline" onClick={handleSignOut}>{t('common.logout')}</Button>
        </div>
      </div>
    );
  }

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === activeOrgId) return;
    await setActiveOrg(orgId);
    qc.clear();
    navigate('/dashboard');
  };

  const groups = NAV
    .map((g) => ({ ...g, items: g.items.filter((i) => can(role, i.module, 'read')) }))
    .filter((g) => g.items.length);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-5">
          <NavLink to="/dashboard"><Logo className="h-8" /></NavLink>
        </div>

        {memberships.length > 0 && (
          <div className="border-b px-3 py-3">
            {memberships.length > 1 ? (
              <select
                value={activeOrgId ?? ''}
                onChange={(e) => handleSwitchOrg(e.target.value)}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30">
                {memberships.map((m) => <option key={m.organization_id} value={m.organization_id}>{m.organization_name}</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-sm font-medium">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{memberships[0].organization_name}</span>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {groups.map((g, gi) => (
            <div key={gi} className="space-y-1">
              {g.groupKey && <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t(`nav.groups.${g.groupKey}`)}</p>}
              {g.items.map(({ to, labelKey, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}>
                  <Icon className="h-4 w-4" /> {t(`nav.${labelKey}`)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t p-3">
          <NavLink to="/profile" className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
            <UserCircle className="h-4 w-4" /> {t('nav.profile')}
          </NavLink>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> {t('common.logout')}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="md:hidden"><Logo className="h-7" /></div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} title={t('publicNav.home')} aria-label={t('publicNav.home')}>
              <Home className="h-4 w-4" />
            </Button>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{t(`roles.${role}`)}</span>
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user.full_name || authUser?.email}</p>
              <p className="text-[11px] text-muted-foreground">{authUser?.email}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
