import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCan } from '@/store/session';

interface Detail {
  supplier: { id: string; name: string; email: string | null; phone: string | null; address: string | null; notes: string | null };
  purchases: { id: string; reference: string; purchase_date: string; total: string }[];
  stats: { orders: number; total_purchased: number };
}

export function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canEdit = useCan('suppliers', 'update');
  const [tab, setTab] = useState('general');
  const { data, isLoading } = useQuery({ queryKey: ['insights', 'supplier', id], queryFn: () => api.get<{ data: Detail }>(`/insights/supplier/${id}`) });
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const s = data.data.supplier;

  return (
    <div className="space-y-6">
      <PageHeader title={s.name} breadcrumb={[{ label: 'Suppliers', to: '/suppliers' }, { label: s.name }]}
        actions={canEdit && <Button className="gap-2" onClick={() => navigate(`/suppliers/${id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Purchase Orders" value={String(data.data.stats.orders)} />
        <Stat label="Total Purchased" value={formatCurrency(data.data.stats.total_purchased)} />
      </div>
      <Card>
        <Tabs active={tab} onChange={setTab} tabs={[
          { value: 'general', label: 'General' },
          { value: 'purchases', label: `Purchase History (${data.data.purchases.length})` },
          { value: 'activity', label: 'Activity' },
        ]} />
        <CardContent className="pt-6">
          {tab === 'general' && (
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Phone" value={s.phone ?? '—'} /><Field label="Email" value={s.email ?? '—'} />
              <Field label="Address" value={s.address ?? '—'} /><Field label="Notes" value={s.notes ?? '—'} />
            </dl>
          )}
          {tab === 'purchases' && (
            data.data.purchases.length ? (
              <Table>
                <THead><TR><TH>Reference</TH><TH>Date</TH><TH className="text-right">Total</TH></TR></THead>
                <TBody>{data.data.purchases.map((p) => (
                  <TR key={p.id}><TD>{p.reference}</TD><TD>{formatDate(p.purchase_date)}</TD><TD className="text-right">{formatCurrency(p.total)}</TD></TR>
                ))}</TBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground">No purchases yet.</p>
          )}
          {tab === 'activity' && <ActivityTimeline entity="suppliers" entityId={id!} />}
        </CardContent>
      </Card>
    </div>
  );
}
const Stat = ({ label, value }: { label: string; value: string }) => (<Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card>);
const Field = ({ label, value }: { label: string; value: string }) => (<div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>);
