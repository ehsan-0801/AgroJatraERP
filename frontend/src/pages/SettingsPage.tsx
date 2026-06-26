import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useCan, useSession } from '@/store/session';
import { useTheme } from '@/store/theme';

export function SettingsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const canCompany = useCan('settings', 'read');
  const tab = section ?? (canCompany ? 'company' : 'profile');
  const tabs = [
    ...(canCompany ? [{ value: 'company', label: 'Company' }] : []),
    { value: 'profile', label: 'Profile' },
    { value: 'security', label: 'Security' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Company & personal preferences" breadcrumb={[{ label: 'Settings' }]} />
      <Tabs active={tab} onChange={(v) => navigate(`/settings/${v}`)} tabs={tabs} />
      {tab === 'company' && canCompany && <CompanySettings />}
      {tab === 'profile' && <ProfileSettings />}
      {tab === 'security' && <SecuritySettings />}
    </div>
  );
}

function CompanySettings() {
  const qc = useQueryClient();
  const canEdit = useCan('settings', 'update');
  const { data } = useQuery({ queryKey: ['company'], queryFn: () => api.get<{ data: any }>('/settings/company') });
  const [f, setF] = useState<Record<string, string>>({});
  useEffect(() => { if (data?.data) setF(data.data); }, [data]);
  const save = useMutation({
    mutationFn: (body: unknown) => api.patch('/settings/company', body),
    onSuccess: () => { toast.success('Company settings saved'); qc.invalidateQueries({ queryKey: ['company'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const fields: [string, string][] = [['name', 'Company Name'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'], ['currency', 'Currency'], ['timezone', 'Timezone'], ['language', 'Language'], ['logo_url', 'Logo URL']];
  return (
    <Card><CardContent className="p-6">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(f); }}>
        {fields.map(([k, label]) => (
          <div key={k} className="space-y-2"><Label>{label}</Label><Input disabled={!canEdit} value={f[k] ?? ''} onChange={set(k)} /></div>
        ))}
        {canEdit && <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending}>Save changes</Button></div>}
      </form>
    </CardContent></Card>
  );
}

function ProfileSettings() {
  const user = useSession((s) => s.user);
  const reload = useSession((s) => s.load);
  const { theme, setTheme } = useTheme();
  const [f, setF] = useState({ full_name: '', phone: '' });
  useEffect(() => { if (user) setF({ full_name: user.full_name ?? '', phone: user.phone ?? '' }); }, [user]);
  const save = useMutation({
    mutationFn: (body: unknown) => api.patch('/settings/profile', body),
    onSuccess: () => { toast.success('Profile saved'); reload(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card><CardContent className="p-6">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(f); }}>
        <div className="space-y-2"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF((s) => ({ ...s, full_name: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))} /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Theme</Label>
          <div className="flex gap-2">{(['light', 'dark', 'system'] as const).map((t) => (
            <Button key={t} type="button" size="sm" variant={theme === t ? 'default' : 'outline'} className="capitalize"
              onClick={() => { setTheme(t); api.patch('/settings/profile', { theme: t }); }}>{t}</Button>
          ))}</div>
        </div>
        <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending}>Save changes</Button></div>
      </form>
    </CardContent></Card>
  );
}

function SecuritySettings() {
  const [pw, setPw] = useState({ a: '', b: '' });
  const save = useMutation({
    mutationFn: (password: string) => api.patch('/settings/security', { password }),
    onSuccess: () => { toast.success('Password updated'); setPw({ a: '', b: '' }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card><CardContent className="p-6">
      <form className="max-w-md space-y-4" onSubmit={(e) => { e.preventDefault(); if (pw.a !== pw.b) return toast.error('Passwords do not match'); save.mutate(pw.a); }}>
        <div className="space-y-2"><Label>New password</Label><Input type="password" minLength={6} required value={pw.a} onChange={(e) => setPw((s) => ({ ...s, a: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Confirm password</Label><Input type="password" minLength={6} required value={pw.b} onChange={(e) => setPw((s) => ({ ...s, b: e.target.value }))} /></div>
        <Button type="submit" disabled={save.isPending}>Update password</Button>
      </form>
    </CardContent></Card>
  );
}
