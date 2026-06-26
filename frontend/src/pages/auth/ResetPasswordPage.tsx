import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './LoginPage';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState({ a: '', b: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.a !== pw.b) return toast.error('Passwords do not match');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Password updated — please sign in');
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="a">New password</Label>
          <PasswordInput id="a" placeholder="At least 6 characters" minLength={6} required value={pw.a} onChange={(e) => setPw((s) => ({ ...s, a: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b">Confirm password</Label>
          <PasswordInput id="b" placeholder="Re-enter password" minLength={6} required value={pw.b} onChange={(e) => setPw((s) => ({ ...s, b: e.target.value }))} />
        </div>
        <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
