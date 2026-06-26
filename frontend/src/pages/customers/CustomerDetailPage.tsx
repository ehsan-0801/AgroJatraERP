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
  customer: { id: string; name: string; email: string | null; phone: string | null; address: string | null; notes: string | null; outstanding_due: string };
  sales: { id: string; invoice_no: string; sale_date: string; total: string; paid: string; due: string }[];
  stats: { orders: number; total_spent: number };
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canEdit = useCan('customers', 'update');
  const [tab, setTab] = useState('general');
  const { data, isLoading } = useQuery({ queryKey: ['insights', 'customer', id], queryFn: () => api.get<{ data: Detail }>(`/insights/customer/${id}`) });
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const c = data.data.customer;

  return (
    <div className="space-y-6">
      <PageHeader title={c.name} breadcrumb={[{ label: 'Customers', to: '/customers' }, { label: c.name }]}
        actions={canEdit && <Button className="gap-2" onClick={() => navigate(`/customers/${id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={String(data.data.stats.orders)} />
        <Stat label="Total Spent" value={formatCurrency(data.data.stats.total_spent)} />
        <Stat label="Outstanding Due" value={formatCurrency(c.outstanding_due)} />
      </div>
      <Card>
        <Tabs active={tab} onChange={setTab} tabs={[
          { value: 'general', label: 'General' },
          { value: 'sales', label: `Purchase History (${data.data.sales.length})` },
          { value: 'activity', label: 'Activity' },
        ]} />
        <CardContent className="pt-6">
          {tab === 'general' && (
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Phone" value={c.phone ?? '—'} /><Field label="Email" value={c.email ?? '—'} />
              <Field label="Address" value={c.address ?? '—'} /><Field label="Notes" value={c.notes ?? '—'} />
            </dl>
          )}
          {tab === 'sales' && (
            data.data.sales.length ? (
              <Table>
                <THead><TR><TH>Invoice</TH><TH>Date</TH><TH className="text-right">Total</TH><TH className="text-right">Paid</TH><TH className="text-right">Due</TH></TR></THead>
                <TBody>{data.data.sales.map((s) => (
                  <TR key={s.id}><TD>{s.invoice_no}</TD><TD>{formatDate(s.sale_date)}</TD>
                    <TD className="text-right">{formatCurrency(s.total)}</TD><TD className="text-right">{formatCurrency(s.paid)}</TD>
                    <TD className="text-right">{formatCurrency(s.due)}</TD></TR>
                ))}</TBody>
              </Table>
            ) : <p className="text-sm text-muted-foreground">No sales yet.</p>
          )}
          {tab === 'activity' && <ActivityTimeline entity="customers" entityId={id!} />}
        </CardContent>
      </Card>
    </div>
  );
}
const Stat = ({ label, value }: { label: string; value: string }) => (<Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card>);
const Field = ({ label, value }: { label: string; value: string }) => (<div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>);
