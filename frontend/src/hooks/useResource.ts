import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, type Paginated } from '@/lib/api';

/** List hook with search, filters and pagination. */
export function useResourceList<T>(resource: string, opts?: { filters?: Record<string, string> }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const filters = opts?.filters ?? {};
  const qs = new URLSearchParams({ page: String(page), limit: '10', search });
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);

  const query = useQuery({
    queryKey: [resource, page, search, filters],
    queryFn: () => api.get<Paginated<T>>(`/${resource}?${qs.toString()}`),
  });
  return { query, page, setPage, search, setSearch };
}

export function useResourceItem<T>(resource: string, id?: string) {
  return useQuery({
    queryKey: [resource, 'item', id],
    queryFn: () => api.get<{ data: T }>(`/${resource}/${id}`),
    enabled: !!id,
  });
}

export function useResourceMutations(resource: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [resource] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const create = useMutation({
    mutationFn: (body: unknown) => api.post(`/${resource}`, body),
    onSuccess: () => { toast.success('Created'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => api.patch(`/${resource}/${id}`, body),
    onSuccess: () => { toast.success('Saved'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => { toast.success('Deleted'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return { create, update, remove };
}
