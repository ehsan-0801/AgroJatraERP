import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { AuthShell } from './LoginPage';

export function RegisterPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      navigate('/onboarding');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally { setLoading(false); }
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell title={t('auth.register.openTitle')} subtitle={t('auth.register.openSubtitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="full_name">{t('auth.register.fullName')}</Label><Input id="full_name" className="h-11" value={form.full_name} onChange={set('full_name')} required /></div>
        <div className="space-y-1.5"><Label htmlFor="email">{t('auth.register.email')}</Label><Input id="email" type="email" className="h-11" placeholder="you@company.com" value={form.email} onChange={set('email')} required /></div>
        <div className="space-y-1.5"><Label htmlFor="password">{t('auth.register.password')}</Label><PasswordInput id="password" minLength={6} value={form.password} onChange={set('password')} required /></div>
        <Button type="submit" className="h-11 w-full gap-2 text-sm font-semibold" disabled={loading}>
          {loading ? t('auth.register.creating') : <>{t('auth.register.create')} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.register.have')}{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">{t('auth.register.signIn')}</Link>
      </p>
    </AuthShell>
  );
}
