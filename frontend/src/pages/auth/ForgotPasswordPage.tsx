import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './LoginPage';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) return toast.error(error.message);
    setSent(true);
  };
  return (
    <AuthShell title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')}>
      {sent ? (
        <div className="rounded-xl border bg-emerald-50 p-5 text-center">
          <MailCheck className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 text-sm text-slate-700">{t('auth.forgot.sent')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">{t('auth.forgot.email')}</Label><Input id="email" type="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <Button type="submit" className="h-11 w-full text-sm font-semibold">{t('auth.forgot.send')}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground"><Link to="/login" className="font-medium text-primary hover:underline">{t('auth.forgot.back')}</Link></p>
    </AuthShell>
  );
}
