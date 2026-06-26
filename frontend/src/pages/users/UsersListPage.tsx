import { ResourceListPage } from '@/components/ResourceListPage';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, type Role } from '@/lib/permissions';
import { formatDate } from '@/lib/utils';

interface U { id: string; email: string; full_name: string | null; role: Role; status: string; created_at: string }

export function UsersListPage() {
  return (
    <ResourceListPage<U>
      module="users" resource="users" title="Users"
      description="Manage team members and their roles"
      singular="User" basePath="/users"
      filters={[{ param: 'role', label: 'Role', options: (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ label: ROLE_LABELS[r], value: r })) }]}
      columns={[
        { header: 'Name', render: (u) => <div><div className="font-medium">{u.full_name || u.email}</div><div className="text-xs text-muted-foreground">{u.email}</div></div> },
        { header: 'Role', render: (u) => <Badge>{ROLE_LABELS[u.role]}</Badge> },
        { header: 'Status', render: (u) => <Badge variant={u.status === 'active' ? 'success' : 'destructive'}>{u.status}</Badge> },
        { header: 'Joined', render: (u) => formatDate(u.created_at) },
      ]}
    />
  );
}
