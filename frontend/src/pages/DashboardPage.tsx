import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Boxes, DollarSign, Plus, ShoppingCart, TrendingUp, Truck, Users, Warehouse,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnimatedNumber, MotionCard, Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  { key: 'total_products', label: 'Products', icon: Boxes },
  { key: 'total_customers', label: 'Customers', icon: Users },
  { key: 'total_suppliers', label: 'Suppliers', icon: Truck },
  { key: 'total_purchases', label: 'Purchases', icon: ShoppingCart },
  { key: 'total_sales', label: 'Sales', icon: TrendingUp },
  { key: 'revenue', label: 'Revenue', icon: DollarSign, money: true },
  { key: 'inventory_value', label: 'Inventory Value', icon: Warehouse, money: true },
  { key: 'low_stock', label: 'Low Stock', icon: AlertTriangle },
];

export function DashboardPage() {
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<Dash>('/dashboard') });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const quickActions = [
    { label: 'New Sale', to: '/sales/new', module: 'sales' as const, icon: TrendingUp },
    { label: 'New Purchase', to: '/purchases/new', module: 'purchases' as const, icon: ShoppingCart },
    { label: 'Add Product', to: '/products/new', module: 'products' as const, icon: Boxes },
    { label: 'Add Customer', to: '/customers/new', module: 'customers' as const, icon: Users },
  ].filter((a) => can(role, a.module, 'create'));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {user?.full_name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-sm text-muted-foreground">Here's how your business is doing today</p>
        </div>
        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Button key={a.to} asChild variant="outline" size="sm" className="gap-2"><Link to={a.to}><Plus className="h-3.5 w-3.5" /> {a.label}</Link></Button>
            ))}
          </div>
        )}
      </div>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4" stagger={0.05}>
        {KPI.map(({ key, label, icon: Icon, money }) => {
          const raw = Number(data?.kpis?.[key] ?? '0') || 0;
          return (
            <MotionCard key={key}><CardContent className="flex items-center justify-between p-5">
              <div><p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-bold">{isLoading ? '—' : <AnimatedNumber value={raw} format={money ? formatCurrency : (n) => Math.round(n).toLocaleString()} />}</p></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            </CardContent></MotionCard>
          );
        })}
      </Stagger>

      <Stagger className="grid gap-4 lg:grid-cols-2" stagger={0.08}>
        <StaggerItem><TrendChart title="Sales Trend (30d)" data={data?.salesTrend} color="#10B981" /></StaggerItem>
        <StaggerItem><TrendChart title="Purchase Trend (30d)" data={data?.purchaseTrend} color="#6366F1" /></StaggerItem>
      </Stagger>

      <Stagger className="grid gap-4 lg:grid-cols-3" stagger={0.08}>
        <StaggerItem><RecentList title="Recent Sales" rows={data?.recentSales?.map((s) => ({ id: s.id, label: s.invoice_no, sub: s.customer_name ?? 'Walk-in', value: s.total, date: s.sale_date }))} /></StaggerItem>
        <StaggerItem><RecentList title="Recent Purchases" rows={data?.recentPurchases?.map((p) => ({ id: p.id, label: p.reference, sub: p.supplier_name ?? '—', value: p.total, date: p.purchase_date }))} /></StaggerItem>
        <StaggerItem><Card>
          <CardHeader><CardTitle className="text-base">Low Stock</CardTitle></CardHeader>
          <CardContent className="p-0">
            {data?.lowStock?.length ? (
              <Table><TBody>{data.lowStock.map((p) => (
                <TR key={p.id}><TD><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.sku}</div></TD>
                  <TD className="text-right text-destructive font-medium">{Number(p.stock)} / {Number(p.min_stock)}</TD></TR>
              ))}</TBody></Table>
            ) : <p className="p-6 text-sm text-muted-foreground">All stocked up 🎉</p>}
          </CardContent>
        </Card></StaggerItem>
      </Stagger>
    </div>
  );
}

function TrendChart({ title, data, color }: { title: string; data?: { date: string; total: number }[]; color: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

function RecentList({ title, rows }: { title: string; rows?: { id: string; label: string; sub: string; value: string; date: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        {rows?.length ? (
          <Table><TBody>{rows.map((r) => (
            <TR key={r.id}><TD><div className="font-medium">{r.label}</div><div className="text-xs text-muted-foreground">{r.sub} · {formatDate(r.date)}</div></TD>
              <TD className="text-right font-medium">{formatCurrency(r.value)}</TD></TR>
          ))}</TBody></Table>
        ) : <p className="p-6 text-sm text-muted-foreground">Nothing yet</p>}
      </CardContent>
    </Card>
  );
}
