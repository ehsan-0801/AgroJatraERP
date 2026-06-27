import { ArrowRight, Building2, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signOut = useAuth((s) => s.signOut);
  const { activeOrgId, isSuperAdmin, loading } = useSession();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  // already onboarded / super admin → leave onboarding
  if (!loading && isSuperAdmin) return <Navigate to="/admin" replace />;
  if (!loading && activeOrgId) return <Navigate to="/dashboard" replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/organizations', form);
      await useSession.getState().load();
      toast.success(t('onboarding.created'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="force-light flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo className="h-8" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => signOut()}><LogOut className="h-4 w-4" /> {t('common.logout')}</Button>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{t('onboarding.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.subtitle')}</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('onboarding.name')} *</Label>
              <Input id="name" className="h-11" value={form.name} onChange={set('name')} placeholder={t('onboarding.namePlaceholder')} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="phone">{t('onboarding.phone')}</Label><Input id="phone" className="h-11" value={form.phone} onChange={set('phone')} /></div>
              <div className="space-y-1.5"><Label htmlFor="email">{t('onboarding.email')}</Label><Input id="email" type="email" className="h-11" value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="address">{t('onboarding.address')}</Label><Textarea id="address" value={form.address} onChange={set('address')} /></div>
            <Button type="submit" className="h-11 w-full gap-2 text-sm font-semibold" disabled={submitting}>
              {submitting ? t('onboarding.creating') : <>{t('onboarding.create')} <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
