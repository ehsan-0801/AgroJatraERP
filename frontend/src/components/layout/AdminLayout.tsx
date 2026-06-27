import { Boxes, Building2, LayoutDashboard, LogOut, Moon, ShieldCheck, Sun, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';
import { useTheme } from '@/store/theme';

export function AdminLayout() {
  const { t } = useTranslation();
  const signOut = useAuth((s) => s.signOut);
  const user = useSession((s) => s.user);
  const { theme, setTheme } = useTheme();

  const nav = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: t('admin.nav.overview') },
    { to: '/admin/organizations', icon: Building2, label: t('admin.nav.organizations') },
    { to: '/admin/data', icon: Boxes, label: t('admin.nav.data') },
    { to: '/admin/users', icon: UsersRound, label: t('admin.nav.users') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5"><Logo className="h-8" /></div>
        <div className="flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
          <ShieldCheck className="h-4 w-4" /> {t('admin.title')}
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-5 backdrop-blur">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{t('admin.badge')}</span>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => signOut()}><LogOut className="h-4 w-4" /> {t('common.logout')}</Button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">
          {/* mobile nav */}
          <nav className="mb-6 flex gap-2 lg:hidden">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => cn('rounded-lg px-3 py-1.5 text-sm font-medium', isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
