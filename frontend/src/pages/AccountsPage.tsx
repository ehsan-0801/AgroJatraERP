import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadCsv } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { canExport } from '@/lib/permissions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRole } from '@/store/session';

interface Summary {
  sales: { count: number; total: number; subtotal: number; tax: number; discount: number; paid: number; due: number };
  purchases: { count: number; total: number; subtotal: number; tax: number; discount: number };
  cogs: number;
  grossProfit: number;
  netCashflow: number;
  receivable: number;
  monthly: { month: string; revenue: number; expense: number }[];
}
interface LedgerRow { id: string; type: 'sale' | 'purchase'; reference: string; date: string; party: string | null; total: number; paid: number }

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 7)}-01`;

export function AccountsPage() {
  const { t } = useTranslation();
  const role = useRole();
  const [from, setFrom] = useState('1900-01-01');
  const [to, setTo] = useState('9999-12-31');
  const [preset, setPreset] = useState('all');
  const [type, setType] = useState('');

  const applyPreset = (p: string) => {
    setPreset(p);
    const now = new Date();
    if (p === 'all') { setFrom('1900-01-01'); setTo('9999-12-31'); }
    else if (p === 'month') { setFrom(monthStart); setTo(today); }
    else if (p === 'ytd') { setFrom(`${now.getFullYear()}-01-01`); setTo(today); }
    else if (p === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); setFrom(d.toISOString().slice(0, 10)); setTo(today); }
  };

  const qs = `from=${from}&to=${to}`;
  const summary = useQuery({ queryKey: ['accounts', 'summary', from, to], queryFn: () => api.get<Summary>(`/accounts/summary?${qs}`) });
  const ledger = useQuery({ queryKey: ['accounts', 'ledger', from, to, type], queryFn: () => api.get<{ data: LedgerRow[] }>(`/accounts/ledger?${qs}&type=${type}`) });

  const s = summary.data;
  const kpis = s ? [
    { label: 'Revenue (Sales)', value: s.sales.total, hint: `${s.sales.count} invoices` },
    { label: 'Cost of Goods Sold', value: s.cogs },
    { label: 'Gross Profit', value: s.grossProfit, accent: s.grossProfit >= 0 ? 'pos' : 'neg' },
    { label: 'Total Purchases', value: s.purchases.total, hint: `${s.purchases.count} orders` },
    { label: 'Tax Collected', value: s.sales.tax },
    { label: 'Discounts Given', value: s.sales.discount },
    { label: 'Payments Received', value: s.sales.paid },
    { label: 'Outstanding Receivable', value: s.receivable, accent: 'neg' },
  ] : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('modules.accounts.title')}
        description={t('modules.accounts.desc')}
        breadcrumb={[{ label: 'Accounts' }]}
        actions={canExport(role) && (
          <Button variant="outline" className="gap-2" disabled={!ledger.data?.data.length}
            onClick={() => downloadCsv(
              (ledger.data?.data ?? []).map((r) => ({
                date: r.date, type: r.type, reference: r.reference, party: r.party ?? '',
                money_in: r.type === 'sale' ? r.total : 0, money_out: r.type === 'purchase' ? r.total : 0,
              })), 'ledger.csv')}>
            <Download className="h-4 w-4" /> Export ledger
          </Button>
        )}
      />

      {/* Date range */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex gap-1">
          {[['all', 'All time'], ['month', 'This month'], ['30d', 'Last 30d'], ['ytd', 'Year to date']].map(([k, l]) => (
            <Button key={k} size="sm" variant={preset === k ? 'default' : 'outline'} onClick={() => applyPreset(k)}>{l}</Button>
          ))}
        </div>
        <div className="space-y-1"><Label className="text-xs">From</Label>
          <Input type="date" className="h-9 w-40" value={from === '1900-01-01' ? '' : from} onChange={(e) => { setFrom(e.target.value || '1900-01-01'); setPreset(''); }} /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label>
          <Input type="date" className="h-9 w-40" value={to === '9999-12-31' ? '' : to} onChange={(e) => { setTo(e.target.value || '9999-12-31'); setPreset(''); }} /></div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}><CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
            <p className={`mt-1 text-xl font-bold ${k.accent === 'pos' ? 'text-emerald-600' : k.accent === 'neg' ? 'text-destructive' : ''}`}>
              {summary.isLoading ? '—' : formatCurrency(k.value)}
            </p>
            {k.hint && <p className="text-[11px] text-muted-foreground">{k.hint}</p>}
          </CardContent></Card>
        ))}
      </div>

      {/* Revenue vs expense chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Revenue vs Expense (12 months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={s?.monthly ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(2)} />
              <YAxis tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ledger */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Transaction Ledger</CardTitle>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All transactions</option>
            <option value="sale">Sales only</option>
            <option value="purchase">Purchases only</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead><TR>
              <TH>Date</TH><TH>Type</TH><TH>Reference</TH><TH>Party</TH>
              <TH className="text-right">Money In</TH><TH className="text-right">Money Out</TH>
            </TR></THead>
            <TBody>
              {ledger.isLoading ? (
                <TR><TD colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TD></TR>
              ) : ledger.data?.data.length ? (
                ledger.data.data.map((r) => (
                  <TR key={`${r.type}-${r.id}`}>
                    <TD>{formatDate(r.date)}</TD>
                    <TD><Badge variant={r.type === 'sale' ? 'success' : 'secondary'}>{r.type}</Badge></TD>
                    <TD className="font-medium">{r.reference}</TD>
                    <TD>{r.party ?? '—'}</TD>
                    <TD className="text-right text-emerald-600">{r.type === 'sale' ? formatCurrency(r.total) : '—'}</TD>
                    <TD className="text-right text-destructive">{r.type === 'purchase' ? formatCurrency(r.total) : '—'}</TD>
                  </TR>
                ))
              ) : (
                <TR><TD colSpan={6} className="py-8 text-center text-muted-foreground">No transactions in this range</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
