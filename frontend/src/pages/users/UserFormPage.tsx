import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useResourceItem, useResourceMutations } from '@/hooks/useResource';
import { ROLE_LABELS, type Role } from '@/lib/permissions';

const ROLE_OPTS = (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function UserFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const item = useResourceItem<any>('users', id);
  const { create, update } = useResourceMutations('users');
  const [f, setF] = useState({ email: '', password: '', full_name: '', phone: '', role: 'viewer', status: 'active' });

  useEffect(() => {
    if (editing && item.data?.data) {
      const u = item.data.data;
      setF((s) => ({ ...s, email: u.email, full_name: u.full_name ?? '', phone: u.phone ?? '', role: u.role, status: u.status }));
    }
  }, [editing, item.data]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await update.mutateAsync({ id: id!, body: { full_name: f.full_name, phone: f.phone, role: f.role, status: f.status } });
    } else {
      await create.mutateAsync({ email: f.email, password: f.password, full_name: f.full_name, phone: f.phone, role: f.role });
    }
    navigate('/users');
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={editing ? 'Edit User' : 'New User'} breadcrumb={[{ label: 'Users', to: '/users' }, { label: editing ? 'Edit' : 'New' }]} />
      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Email *</Label><Input type="email" required disabled={editing} value={f.email} onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))} /></div>
          {!editing && <div className="space-y-2"><Label>Password *</Label><PasswordInput required minLength={6} value={f.password} onChange={(e) => setF((s) => ({ ...s, password: e.target.value }))} /></div>}
          <div className="space-y-2"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF((s) => ({ ...s, full_name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Role *</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.role} onChange={(e) => setF((s) => ({ ...s, role: e.target.value }))}>
              {ROLE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {editing && <div className="space-y-2"><Label>Status</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.status} onChange={(e) => setF((s) => ({ ...s, status: e.target.value }))}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>}
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>{editing ? 'Save changes' : 'Create User'}</Button>
      </div>
    </form>
  );
}
