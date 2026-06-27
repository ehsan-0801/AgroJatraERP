import { ArrowRight, BarChart3, Boxes, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';

export function LoginPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate('/dashboard');
  };

  return (
    <AuthShell title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.login.email')}</Label>
          <Input id="email" type="email" className="h-11" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth.login.password')}</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">{t('auth.login.forgot')}</Link>
          </div>
          <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="h-11 w-full gap-2 text-sm font-semibold" disabled={loading}>
          {loading ? t('auth.login.signingIn') : <>{t('auth.login.signIn')} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">{t('auth.login.createOne')}</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  const highlights = [
    { icon: Boxes, text: t('auth.panel.h1') },
    { icon: BarChart3, text: t('auth.panel.h2') },
    { icon: ShieldCheck, text: t('auth.panel.h3') },
  ];
  return (
    <div className="force-light grid min-h-screen bg-white text-slate-900 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur">A</div>
          <span className="text-lg font-bold">AgroJatra ERP</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">{t('auth.panel.headline')}</h2>
          <p className="mt-4 text-emerald-50/90">{t('auth.panel.sub')}</p>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-sm text-emerald-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15"><h.icon className="h-4 w-4" /></span>{h.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-emerald-50/80"><CheckCircle2 className="h-4 w-4" /> {t('auth.panel.trusted')}</div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:invisible"><Logo className="h-8" /></Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm py-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
