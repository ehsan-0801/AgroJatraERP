import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Boxes, DollarSign, Plus, ShoppingCart, TrendingUp, Truck, Users, Warehouse,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnimatedNumber, MotionCard, Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { can } from '@/lib/permissions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSession } from '@/store/session';

interface Dash {
  kpis: Record<string, string>;
  salesTrend: { date: string; total: number }[];
  purchaseTrend: { date: string; total: number }[];
  topProducts: { name: string; qty: number }[];
  recentSales: { id: string; invoice_no: string; total: string; sale_date: string; customer_name: string | null }[];
  recentPurchases: { id: string; reference: string; total: string; purchase_date: string; supplier_name: string | null }[];
  lowStock: { id: string; name: string; sku: string; stock: string; min_stock: string }[];
}

const KPI = [
  { key: 'total_products', icon: Boxes },
  { key: 'total_customers', icon: Users },
  { key: 'total_suppliers', icon: Truck },
  { key: 'total_purchases', icon: ShoppingCart },
  { key: 'total_sales', icon: TrendingUp },
  { key: 'revenue', icon: DollarSign, money: true },
  { key: 'inventory_value', icon: Warehouse, money: true },
  { key: 'low_stock', icon: AlertTriangle },
];

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<Dash>('/dashboard') });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.greetingMorning') : hour < 18 ? t('dashboard.greetingAfternoon') : t('dashboard.greetingEvening');

  const quickActions = [
    { k: 'newSale', to: '/sales/new', module: 'sales' as const },
    { k: 'newPurchase', to: '/purchases/new', module: 'purchases' as const },
    { k: 'addProduct', to: '/products/new', module: 'products' as const },
    { k: 'addCustomer', to: '/customers/new', module: 'customers' as const },
  ].filter((a) => can(role, a.module, 'create'));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {user?.full_name?.split(' ')[0] || t('dashboard.there')} 👋</h1>
          <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Button key={a.to} asChild variant="outline" size="sm" className="gap-2"><Link to={a.to}><Plus className="h-3.5 w-3.5" /> {t(`dashboard.quick.${a.k}`)}</Link></Button>
            ))}
          </div>
        )}
      </div>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4" stagger={0.05}>
        {KPI.map(({ key, icon: Icon, money }) => {
          const raw = Number(data?.kpis?.[key] ?? '0') || 0;
          return (
            <MotionCard key={key}><CardContent className="flex items-center justify-between p-5">
              <div><p className="text-xs font-medium text-muted-foreground">{t(`dashboard.kpis.${key}`)}</p>
                {isLoading
                  ? <Skeleton className="mt-2 h-6 w-24" />
                  : <p className="mt-1 text-xl font-bold"><AnimatedNumber value={raw} format={money ? formatCurrency : (n) => Math.round(n).toLocaleString()} /></p>}</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            </CardContent></MotionCard>
          );
        })}
      </Stagger>

      <Stagger className="grid gap-4 lg:grid-cols-2" stagger={0.08}>
        <StaggerItem><TrendChart title={t('dashboard.salesTrend')} data={data?.salesTrend} color="#10B981" loading={isLoading} /></StaggerItem>
        <StaggerItem><TrendChart title={t('dashboard.purchaseTrend')} data={data?.purchaseTrend} color="#6366F1" loading={isLoading} /></StaggerItem>
      </Stagger>

      <Stagger className="grid gap-4 lg:grid-cols-3" stagger={0.08}>
        <StaggerItem><RecentList title={t('dashboard.recentSales')} loading={isLoading} rows={data?.recentSales?.map((s) => ({ id: s.id, label: s.invoice_no, sub: s.customer_name ?? t('dashboard.walkIn'), value: s.total, date: s.sale_date }))} /></StaggerItem>
        <StaggerItem><RecentList title={t('dashboard.recentPurchases')} loading={isLoading} rows={data?.recentPurchases?.map((p) => ({ id: p.id, label: p.reference, sub: p.supplier_name ?? '—', value: p.total, date: p.purchase_date }))} /></StaggerItem>
        <StaggerItem><Card>
          <CardHeader><CardTitle className="text-base">{t('dashboard.lowStock')}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : data?.lowStock?.length ? (
              <Table><TBody>{data.lowStock.map((p) => (
                <TR key={p.id}><TD><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.sku}</div></TD>
                  <TD className="text-right text-destructive font-medium">{Number(p.stock)} / {Number(p.min_stock)}</TD></TR>
              ))}</TBody></Table>
            ) : <p className="p-6 text-sm text-muted-foreground">{t('dashboard.allStocked')}</p>}
          </CardContent>
        </Card></StaggerItem>
      </Stagger>
    </div>
  );
}

function TrendChart({ title, data, color, loading }: { title: string; data?: { date: string; total: number }[]; color: string; loading?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data ?? []}>
            <defs><linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3} /><stop offset="95%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5)} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip />
            <Area type="monotone" dataKey="total" stroke={color} fill={`url(#g-${color})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RecentList({ title, rows, loading }: { title: string; rows?: { id: string; label: string; sub: string; value: string; date: string }[]; loading?: boolean }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : rows?.length ? (
          <Table><TBody>{rows.map((r) => (
            <TR key={r.id}><TD><div className="font-medium">{r.label}</div><div className="text-xs text-muted-foreground">{r.sub} · {formatDate(r.date)}</div></TD>
              <TD className="text-right font-medium">{formatCurrency(r.value)}</TD></TR>
          ))}</TBody></Table>
        ) : <p className="p-6 text-sm text-muted-foreground">{t('dashboard.nothingYet')}</p>}
      </CardContent>
    </Card>
  );
}
