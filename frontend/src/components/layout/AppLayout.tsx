import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, Boxes, Building2, FileBarChart, LayoutDashboard, LogOut, Moon, Settings,
  ShieldCheck, ShoppingCart, Sun, Tags, Truck, UserCircle, Users, UsersRound,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatePresence, PageTransition } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { can, ROLE_LABELS, type Module } from '@/lib/permissions';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';
import { useTheme } from '@/store/theme';

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; module: Module; end?: boolean }
interface NavGroup { group?: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard', end: true }] },
  { group: 'Inventory', items: [
    { to: '/products', label: 'Products', icon: Boxes, module: 'products' },
    { to: '/categories', label: 'Categories', icon: Tags, module: 'categories' },
  ] },
  { group: 'CRM', items: [
    { to: '/customers', label: 'Customers', icon: Users, module: 'customers' },
    { to: '/suppliers', label: 'Suppliers', icon: Truck, module: 'suppliers' },
  ] },
  { group: 'Transactions', items: [
    { to: '/purchases', label: 'Purchases', icon: ShoppingCart, module: 'purchases' },
    { to: '/sales', label: 'Sales', icon: BarChart3, module: 'sales' },
  ] },
  { group: 'Insights', items: [
    { to: '/reports', label: 'Reports', icon: FileBarChart, module: 'reports' },
  ] },
  { group: 'Administration', items: [
    { to: '/users', label: 'Users', icon: UsersRound, module: 'users' },
    { to: '/roles', label: 'Roles', icon: ShieldCheck, module: 'users' },
    { to: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
  ] },
];

export function AppLayout() {
  const { user: authUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const user = useSession((s) => s.user);
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
          <Button onClick={() => reload()}>Retry</Button>
          <Button variant="outline" onClick={handleSignOut}>Log out</Button>
        </div>
      </div>
    );
  }

  const role = user.role;
  const groups = NAV
    .map((g) => ({ ...g, items: g.items.filter((i) => can(role, i.module, 'read')) }))
    .filter((g) => g.items.length);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">A</div>
          <div>
            <p className="text-sm font-semibold leading-tight">AgroJatra ERP</p>
            <p className="text-[10px] text-muted-foreground">Everything in one place</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {groups.map((g, gi) => (
            <div key={gi} className="space-y-1">
              {g.group && <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</p>}
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}>
                  <Icon className="h-4 w-4" /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t p-3">
          <NavLink to="/profile" className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
            <UserCircle className="h-4 w-4" /> Profile
          </NavLink>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="md:hidden font-semibold">AgroJatra ERP</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{ROLE_LABELS[role]}</span>
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
