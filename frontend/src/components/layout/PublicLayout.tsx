import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, PageTransition, motion } from '@/components/motion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';

const NAV: { to: string; key: string; end?: boolean }[] = [
  { to: '/', key: 'home', end: true },
  { to: '/features', key: 'features' },
  { to: '/about', key: 'about' },
  { to: '/contact', key: 'contact' },
];

export function PublicLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const cta = user ? { to: '/dashboard', label: t('common.goToDashboard') } : { to: '/login', label: t('common.signIn') };

  return (
    <div className="force-light flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center"><Logo className="h-8" /></Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => cn('rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                {t(`publicNav.${n.key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <Button asChild><Link to={cta.to}>{cta.label}</Link></Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="mobile-menu" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden border-t bg-background md:hidden">
              <nav className="container flex flex-col py-2">
                {NAV.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    {t(`publicNav.${n.key}`)}
                  </NavLink>
                ))}
                <div className="mt-2 px-3 pb-2">
                  <Button asChild className="w-full"><Link to={cta.to}>{cta.label}</Link></Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}><Outlet /></PageTransition>
        </AnimatePresence>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container grid gap-8 py-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo className="h-7" />
            <p className="mt-3 text-sm text-muted-foreground">{t('footer.tagline')}</p>
          </div>
          <FooterCol title={t('footer.product')} links={[[t('publicNav.features'), '/features'], [t('publicNav.about'), '/about']]} />
          <FooterCol title={t('footer.company')} links={[[t('publicNav.contact'), '/contact'], [t('common.signIn'), '/login']]} />
          <FooterCol title={t('footer.access')} links={[[t('common.signIn'), '/login'], [t('common.dashboard'), '/dashboard']]} />
        </div>
        <div className="border-t py-6">
          <p className="container text-center text-xs text-muted-foreground">{t('footer.rights', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
