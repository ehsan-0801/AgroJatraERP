import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, type Crumb } from '@/components/PageHeader';
import { useResourceItem, useResourceMutations } from '@/hooks/useResource';
import { api, type Paginated } from '@/lib/api';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'textarea' | 'select';
  required?: boolean;
  step?: string;
  placeholder?: string;
  section?: string;
  optionsResource?: string; // load {id,name} options
  options?: { label: string; value: string }[];
  full?: boolean; // span full width
}

interface Props<T> {
  resource: string;
  singular: string; // e.g. "Product"
  listPath: string; // e.g. "/products"
  fields: FormField[];
  /** map a loaded row → form values (defaults: copy matching keys) */
  toForm?: (row: T) => Record<string, string>;
  /** map form values → request body (defaults: numbers parsed, '' → undefined) */
  toBody?: (values: Record<string, string>) => Record<string, unknown>;
}

function AsyncOptions({ field, value, onChange }: { field: FormField; value: string; onChange: (v: string) => void }) {
  const { data } = useQuery({
    queryKey: [field.optionsResource, 'opts'],
    queryFn: () => api.get<Paginated<{ id: string; name: string }>>(`/${field.optionsResource}?limit=200`),
    enabled: !!field.optionsResource,
  });
  return (
    <select
      id={field.name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">— none —</option>
      {data?.data.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}

export function ResourceFormPage<T extends Record<string, unknown>>({
  resource, singular, listPath, fields, toForm, toBody,
}: Props<T>) {
  const { t } = useTranslation();
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const item = useResourceItem<T>(resource, id);
  const { create, update } = useResourceMutations(resource);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editing && item.data?.data) {
      const row = item.data.data;
      if (toForm) setValues(toForm(row));
      else {
        const v: Record<string, string> = {};
        fields.forEach((f) => {
          const raw = row[f.name];
          v[f.name] = raw === null || raw === undefined ? '' : String(raw);
        });
        setValues(v);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, item.data]);

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = toBody
      ? toBody(values)
      : fields.reduce<Record<string, unknown>>((acc, f) => {
          const raw = values[f.name];
          if (raw === undefined) return acc;
          if (raw === '') { if (editing) acc[f.name] = null; return acc; }
          acc[f.name] = f.type === 'number' ? Number(raw) : raw;
          return acc;
        }, {});
    if (editing) await update.mutateAsync({ id: id!, body });
    else await create.mutateAsync(body);
    navigate(listPath);
  };

  const sections = Array.from(new Set(fields.map((f) => f.section ?? 'General Information')));
  const crumbs: Crumb[] = [
    { label: singular, to: listPath },
    { label: editing ? t('common.edit') : t('common.add') },
  ];

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={editing ? t('common.editItem', { name: singular }) : t('common.newItem', { name: singular })} breadcrumb={crumbs} />
      {sections.map((section) => (
        <Card key={section}>
          <CardHeader><CardTitle className="text-base">{section}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {fields.filter((f) => (f.section ?? 'General Information') === section).map((f) => (
              <div key={f.name} className={`space-y-2 ${f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                {f.type === 'textarea' ? (
                  <Textarea id={f.name} value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} />
                ) : f.type === 'select' && f.optionsResource ? (
                  <AsyncOptions field={f} value={values[f.name] ?? ''} onChange={(v) => set(f.name, v)} />
                ) : f.type === 'select' ? (
                  <select
                    id={f.name}
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type ?? 'text'}
                    step={f.step}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(listPath)}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {editing ? t('common.saveChanges') : t('common.createItem', { name: singular })}
        </Button>
      </div>
    </form>
  );
}
