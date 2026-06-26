import { useQuery } from '@tanstack/react-query';
import { Pencil, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCan } from '@/store/session';

export function TransactionDetailPage({ kind }: { kind: 'purchase' | 'sale' }) {
  const isSale = kind === 'sale';
  const resource = isSale ? 'sales' : 'purchases';
  const listPath = isSale ? '/sales' : '/purchases';
  const { id } = useParams();
  const navigate = useNavigate();
  const canEdit = useCan(resource as 'sales' | 'purchases', 'update');
  const { data, isLoading } = useQuery({ queryKey: [resource, 'item', id], queryFn: () => api.get<{ data: any }>(`/${resource}/${id}`) });
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const d = data.data;
  const ref = isSale ? d.invoice_no : d.reference;
  const party = isSale ? d.customer_name : d.supplier_name;
  const date = isSale ? d.sale_date : d.purchase_date;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={ref}
        breadcrumb={[{ label: isSale ? 'Sales' : 'Purchases', to: listPath }, { label: ref }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
            {canEdit && <Button className="gap-2" onClick={() => navigate(`${listPath}/${id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>}
          </div>
        }
      />
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{isSale ? 'Customer' : 'Supplier'}</p>
              <p className="font-medium">{party ?? '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(date)}</p>
            </div>
          </div>
          <Table>
            <THead><TR><TH>Product</TH><TH className="text-right">Qty</TH><TH className="text-right">Price</TH><TH className="text-right">Total</TH></TR></THead>
            <TBody>{d.items.map((it: any, i: number) => (
              <TR key={i}><TD>{it.product_name}</TD><TD className="text-right">{Number(it.quantity)}</TD>
                <TD className="text-right">{formatCurrency(it.unit_price)}</TD><TD className="text-right">{formatCurrency(it.line_total)}</TD></TR>
            ))}</TBody>
          </Table>
          <div className="ml-auto w-60 space-y-1 text-sm">
            <Row label="Subtotal" value={formatCurrency(d.subtotal)} />
            <Row label="Tax" value={formatCurrency(d.tax)} />
            <Row label="Discount" value={`- ${formatCurrency(d.discount)}`} />
            <Row label="Total" value={formatCurrency(d.total)} bold />
            {isSale && <><Row label="Paid" value={formatCurrency(d.paid)} /><Row label="Due" value={formatCurrency(Math.max(0, Number(d.total) - Number(d.paid)))} /></>}
          </div>
          {d.notes && <p className="text-sm text-muted-foreground">Notes: {d.notes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between ${bold ? 'border-t pt-1 font-semibold' : ''}`}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>
);
