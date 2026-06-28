import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
interface Statement {
  rows: { date: string; type: 'invoice' | 'payment'; ref: string; debit: number; credit: number; balance: number }[];
  summary: { totalSales: number; totalPaid: number; outstanding: number };
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canEdit = useCan('customers', 'update');
  const canPay = useCan('sales', 'create');
  const [tab, setTab] = useState('general');
  const [payOpen, setPayOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['insights', 'customer', id], queryFn: () => api.get<{ data: Detail }>(`/insights/customer/${id}`) });
  const statement = useQuery({ queryKey: ['statement', id], queryFn: () => api.get<{ data: Statement }>(`/payments/statement/${id}`), enabled: tab === 'statement' });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const c = data.data.customer;

  return (
    <div className="space-y-6">
      <PageHeader title={c.name} breadcrumb={[{ label: 'Customers', to: '/customers' }, { label: c.name }]}
        actions={<div className="flex gap-2">
          {canPay && <Button variant="outline" className="gap-2" onClick={() => setPayOpen(true)}><Wallet className="h-4 w-4" /> Record payment</Button>}
          {canEdit && <Button className="gap-2" onClick={() => navigate(`/customers/${id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>}
        </div>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={String(data.data.stats.orders)} />
        <Stat label="Total Spent" value={formatCurrency(data.data.stats.total_spent)} />
        <Stat label="Outstanding Due" value={formatCurrency(c.outstanding_due)} />
      </div>
      <Card>
        <Tabs active={tab} onChange={setTab} tabs={[
          { value: 'general', label: 'General' },
          { value: 'sales', label: `Purchase History (${data.data.sales.length})` },
          { value: 'statement', label: 'Statement' },
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
          {tab === 'statement' && (
            statement.isLoading || !statement.data ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat label="Total Invoiced" value={formatCurrency(statement.data.data.summary.totalSales)} />
                  <Stat label="Total Paid" value={formatCurrency(statement.data.data.summary.totalPaid)} />
                  <Stat label="Outstanding" value={formatCurrency(statement.data.data.summary.outstanding)} />
                </div>
                {statement.data.data.rows.length ? (
                  <Table>
                    <THead><TR><TH>Date</TH><TH>Type</TH><TH>Ref</TH><TH className="text-right">Debit</TH><TH className="text-right">Credit</TH><TH className="text-right">Balance</TH></TR></THead>
                    <TBody>{statement.data.data.rows.map((r, i) => (
                      <TR key={i}><TD>{formatDate(r.date)}</TD><TD className="capitalize">{r.type}</TD><TD>{r.ref}</TD>
                        <TD className="text-right">{r.debit ? formatCurrency(r.debit) : '—'}</TD>
                        <TD className="text-right">{r.credit ? formatCurrency(r.credit) : '—'}</TD>
                        <TD className="text-right font-medium">{formatCurrency(r.balance)}</TD></TR>
                    ))}</TBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">No transactions yet.</p>}
              </div>
            )
          )}
          {tab === 'activity' && <ActivityTimeline entity="customers" entityId={id!} />}
        </CardContent>
      </Card>

      <PaymentDialog open={payOpen} onClose={() => setPayOpen(false)} customerId={id!} due={Number(c.outstanding_due)}
        onDone={() => { qc.invalidateQueries({ queryKey: ['insights', 'customer', id] }); qc.invalidateQueries({ queryKey: ['statement', id] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); }} />
    </div>
  );
}

function PaymentDialog({ open, onClose, customerId, due, onDone }: { open: boolean; onClose: () => void; customerId: string; due: number; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const save = useMutation({
    mutationFn: () => api.post('/payments', { customer_id: customerId, amount: Number(amount), method, note: note || undefined }),
    onSuccess: () => { toast.success('Payment recorded'); onDone(); onClose(); setAmount(''); setNote(''); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Outstanding due: <span className="font-medium text-foreground">{formatCurrency(due)}</span></p>
          <div className="space-y-1.5"><Label>Amount *</Label><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value.replace(/^0+(?=\d)/, ''))} /></div>
          <div className="space-y-1.5"><Label>Method</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              {['cash', 'card', 'bank', 'mobile'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { const n = Number(amount); if (!n || n <= 0) return toast.error('Enter a valid amount'); save.mutate(); }} disabled={save.isPending}>Record</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (<Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card>);
const Field = ({ label, value }: { label: string; value: string }) => (<div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>);
