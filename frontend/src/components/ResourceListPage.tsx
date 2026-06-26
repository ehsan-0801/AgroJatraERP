import { useQuery } from '@tanstack/react-query';
import { Download, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Column, DataTable, downloadCsv } from '@/components/DataTable';
import { PageHeader, type Crumb } from '@/components/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/useResource';
import { api, type Paginated } from '@/lib/api';
import type { Module } from '@/lib/permissions';
import { useCan } from '@/store/session';

export interface FilterDef {
  param: string;
  label: string;
  options?: { label: string; value: string }[];
  optionsResource?: string; // load {id,name}
}

interface Props<T extends { id: string }> {
  module: Module;
  resource: string;
  title: string;
  description?: string;
  singular: string;
  basePath: string; // e.g. /products
  columns: Column<T>[];
  filters?: FilterDef[];
  searchPlaceholder?: string;
  /** clicking a row / view icon goes to detail; if false, no detail */
  hasDetail?: boolean;
  /** map rows for CSV export */
  exportRows?: (rows: T[]) => Record<string, unknown>[];
}

function FilterSelect({ filter, value, onChange }: { filter: FilterDef; value: string; onChange: (v: string) => void }) {
  const { data } = useQuery({
    queryKey: [filter.optionsResource, 'filteropts'],
    queryFn: () => api.get<Paginated<{ id: string; name: string }>>(`/${filter.optionsResource}?limit=200`),
    enabled: !!filter.optionsResource,
  });
  const options = filter.options ?? data?.data.map((o) => ({ label: o.name, value: o.id })) ?? [];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">{filter.label}: All</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function ResourceListPage<T extends { id: string }>({
  module, resource, title, description, singular, basePath, columns, filters = [], searchPlaceholder, hasDetail, exportRows,
}: Props<T>) {
  const navigate = useNavigate();
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { query, page, setPage, search, setSearch } = useResourceList<T>(resource, { filters: filterValues });
  const { remove } = useResourceMutations(resource);

  const canCreate = useCan(module, 'create');
  const canUpdate = useCan(module, 'update');
  const canDelete = useCan(module, 'delete');
  const showActions = hasDetail || canUpdate || canDelete;

  const crumbs: Crumb[] = [{ label: title }];

  const actionCol: Column<T> = {
    header: 'Actions',
    className: 'text-right',
    render: (row) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {hasDetail && (
          <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`${basePath}/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {canUpdate && (
          <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`${basePath}/${row.id}/edit`)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {canDelete && (
          <Button variant="ghost" size="icon" title="Delete" onClick={() => { if (confirm('Delete this record?')) remove.mutate(row.id); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    ),
  };

  const result = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description={description}
        breadcrumb={crumbs}
        actions={canCreate && <Button className="gap-2" onClick={() => navigate(`${basePath}/new`)}><Plus className="h-4 w-4" /> Add {singular}</Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {filters.map((f) => (
          <FilterSelect key={f.param} filter={f} value={filterValues[f.param] ?? ''}
            onChange={(v) => { setFilterValues((s) => ({ ...s, [f.param]: v })); setPage(1); }} />
        ))}
        {exportRows && (
          <Button variant="outline" className="gap-2" disabled={!result?.data.length}
            onClick={() => downloadCsv(exportRows(result!.data), `${resource}.csv`)}>
            <Download className="h-4 w-4" /> Export
          </Button>
        )}
      </div>

      <DataTable<T>
        columns={showActions ? [...columns, actionCol] : columns}
        rows={result?.data}
        loading={query.isLoading}
        onRowClick={hasDetail ? (row) => navigate(`${basePath}/${row.id}`) : undefined}
        page={result?.page}
        pages={result?.pages}
        total={result?.total}
        onPage={setPage}
      />
    </div>
  );
}
