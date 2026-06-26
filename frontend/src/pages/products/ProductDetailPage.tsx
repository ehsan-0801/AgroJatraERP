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
  product: { id: string; name: string; sku: string; barcode: string | null; unit: string; category_name: string | null;
    purchase_price: string; selling_price: string; stock: string; min_stock: string; status: string };
  purchaseHistory: { reference: string; purchase_date: string; supplier_name: string | null; quantity: string; unit_price: string; line_total: string }[];
  salesHistory: { invoice_no: string; sale_date: string; customer_name: string | null; quantity: string; unit_price: string; line_total: string }[];
  stats: { units_sold: number; revenue: number };
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canEdit = useCan('products', 'update');
  const [tab, setTab] = useState('general');
  const { data, isLoading } = useQuery({ queryKey: ['insights', 'product', id], queryFn: () => api.get<{ data: Detail }>(`/insights/product/${id}`) });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const p = data.data.product;

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.name}
        breadcrumb={[{ label: 'Products', to: '/products' }, { label: p.name }]}
        actions={canEdit && <Button className="gap-2" onClick={() => navigate(`/products/${id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Stock" value={Number(p.stock).toLocaleString()} />
        <Stat label="Selling Price" value={formatCurrency(p.selling_price)} />
        <Stat label="Units Sold" value={data.data.stats.units_sold.toLocaleString()} />
        <Stat label="Revenue" value={formatCurrency(data.data.stats.revenue)} />
      </div>

      <Card>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { value: 'general', label: 'General' },
            { value: 'purchases', label: `Purchase History (${data.data.purchaseHistory.length})` },
            { value: 'sales', label: `Sales History (${data.data.salesHistory.length})` },
            { value: 'activity', label: 'Activity' },
          ]}
        />
        <CardContent className="pt-6">
          {tab === 'general' && (
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="SKU" value={p.sku} />
              <Field label="Barcode" value={p.barcode ?? '—'} />
              <Field label="Category" value={p.category_name ?? '—'} />
              <Field label="Unit" value={p.unit} />
              <Field label="Purchase Price" value={formatCurrency(p.purchase_price)} />
              <Field label="Selling Price" value={formatCurrency(p.selling_price)} />
              <Field label="Minimum Stock" value={Number(p.min_stock).toLocaleString()} />
              <Field label="Status" value={p.status} />
            </dl>
          )}
          {tab === 'purchases' && (
            <HistoryTable
              rows={data.data.purchaseHistory.map((h) => [h.reference, formatDate(h.purchase_date), h.supplier_name ?? '—', Number(h.quantity), formatCurrency(h.line_total)])}
              head={['Reference', 'Date', 'Supplier', 'Qty', 'Total']}
            />
          )}
          {tab === 'sales' && (
            <HistoryTable
              rows={data.data.salesHistory.map((h) => [h.invoice_no, formatDate(h.sale_date), h.customer_name ?? '—', Number(h.quantity), formatCurrency(h.line_total)])}
              head={['Invoice', 'Date', 'Customer', 'Qty', 'Total']}
            />
          )}
          {tab === 'activity' && <ActivityTimeline entity="products" entityId={id!} />}
        </CardContent>
      </Card>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card>
);
const Field = ({ label, value }: { label: string; value: string }) => (
  <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium capitalize">{value}</dd></div>
);
function HistoryTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">No records.</p>;
  return (
    <Table>
      <THead><TR>{head.map((h, i) => <TH key={i} className={i >= 3 ? 'text-right' : ''}>{h}</TH>)}</TR></THead>
      <TBody>{rows.map((r, i) => <TR key={i}>{r.map((c, j) => <TD key={j} className={j >= 3 ? 'text-right' : ''}>{c}</TD>)}</TR>)}</TBody>
    </Table>
  );
}
