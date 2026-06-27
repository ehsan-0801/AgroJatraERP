import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useResourceMutations } from '@/hooks/useResource';
import { api } from '@/lib/api';
import { ROLE_LABELS, type Role } from '@/lib/permissions';
import { formatDate } from '@/lib/utils';

interface Member { id: string; email: string; full_name: string | null; role: Role; status: string; created_at: string; is_owner: boolean }
interface MembersResp { data: Member[]; total: number; limit: number; currentUserId: string }

const ROLE_OPTS = (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function UsersListPage() {
  const { t } = useTranslation();
  const { update, remove } = useResourceMutations('users');
  const { data } = useQuery({ queryKey: ['users', 'members'], queryFn: () => api.get<MembersResp>('/users') });

  const members = data?.data ?? [];
  const limit = data?.limit ?? 5;
  const atCap = members.length >= limit;
  const me = data?.currentUserId;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('modules.users.title')}
        description={`${t('members.count', { current: members.length, max: limit })}`}
        breadcrumb={[{ label: t('nav.users') }]}
        actions={
          <Button asChild disabled={atCap} className="gap-1.5" title={atCap ? t('members.capReached') : undefined}>
            <Link to={atCap ? '#' : '/users/new'} onClick={(e) => atCap && e.preventDefault()}><Plus className="h-4 w-4" /> {t('members.add')}</Link>
          </Button>
        }
      />
      {atCap && <p className="-mt-2 text-sm text-amber-600">{t('members.capReached')}</p>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('members.name')}</th>
                <th className="px-4 py-3">{t('members.role')}</th>
                <th className="px-4 py-3">{t('members.status')}</th>
                <th className="px-4 py-3">{t('members.joined')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const locked = m.is_owner || m.id === me;
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.full_name || m.email}{m.is_owner && <span className="ml-2 text-xs text-primary">({t('members.owner')})</span>}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-60"
                        value={m.role} disabled={locked}
                        onChange={(e) => update.mutate({ id: m.id, body: { role: e.target.value } })}>
                        {ROLE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={locked}
                        onClick={() => update.mutate({ id: m.id, body: { status: m.status === 'active' ? 'inactive' : 'active' } })}
                        className="disabled:cursor-default">
                        <Badge variant={m.status === 'active' ? 'success' : 'destructive'}>{m.status}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" disabled={locked}
                        onClick={() => { if (confirm(t('members.removeConfirm', { name: m.full_name || m.email }))) remove.mutate(m.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
