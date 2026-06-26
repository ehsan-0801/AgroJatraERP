import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { api } from '@/lib/api';

interface Entry {
  id: string;
  action: string;
  description: string | null;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
}

export function ActivityTimeline({ entity, entityId }: { entity: string; entityId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', entity, entityId],
    queryFn: () => api.get<{ data: Entry[] }>(`/activity?entity=${entity}&entity_id=${entityId}&limit=50`),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  if (!data?.data.length) return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;

  return (
    <ol className="relative space-y-5 border-l pl-6">
      {data.data.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[1.7rem] flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Activity className="h-3 w-3" />
          </span>
          <p className="text-sm font-medium capitalize">{e.action} {e.description ? `— ${e.description}` : ''}</p>
          <p className="text-xs text-muted-foreground">
            {e.user_name || e.user_email || 'System'} · {new Date(e.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
