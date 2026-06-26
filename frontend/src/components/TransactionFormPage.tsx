import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResourceMutations } from '@/hooks/useResource';
import { api, type Paginated } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Product { id: string; name: string; sku: string; stock: string; purchase_price: string; selling_price: string }
interface Party { id: string; name: string }
interface Line { product_id: string; quantity: number; unit_price: number }

interface Props {
  kind: 'purchase' | 'sale';
}

export function TransactionFormPage({ kind }: Props) {
  const isSale = kind === 'sale';
  const resource = isSale ? 'sales' : 'purchases';
  const partyResource = isSale ? 'customers' : 'suppliers';
  const priceField = isSale ? 'selling_price' : 'purchase_price';
  const listPath = isSale ? '/sales' : '/purchases';
  const singular = isSale ? 'Sale' : 'Purchase';
  const partyLabel = isSale ? 'Customer' : 'Supplier';
  const refLabel = isSale ? 'Invoice No' : 'Reference';

  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const { create, update } = useResourceMutations(resource);

  const products = useQuery({ queryKey: ['products', 'all'], queryFn: () => api.get<Paginated<Product>>('/products?limit=500') });
  const parties = useQuery({ queryKey: [partyResource, 'all'], queryFn: () => api.get<Paginated<Party>>(`/${partyResource}?limit=500`) });
  const existing = useQuery({ queryKey: [resource, 'item', id], queryFn: () => api.get<{ data: any }>(`/${resource}/${id}`), enabled: editing });

  const [lines, setLines] = useState<Line[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [meta, setMeta] = useState({ party_id: '', reference: '', date: '', tax: 0, discount: 0, paid: 0, payment_method: 'cash', notes: '' });

  useEffect(() => {
    if (editing && existing.data?.data) {
      const d = existing.data.data;
      setLines(d.items.map((i: any) => ({ product_id: i.product_id, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })));
      setMeta({
        party_id: (isSale ? d.customer_id : d.supplier_id) ?? '',
        reference: (isSale ? d.invoice_no : d.reference) ?? '',
        date: ((isSale ? d.sale_date : d.purchase_date) ?? '').slice(0, 10),
        tax: Number(d.tax ?? 0), discount: Number(d.discount ?? 0), paid: Number(d.paid ?? 0),
        payment_method: d.payment_method ?? 'cash', notes: d.notes ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.data]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unit_price, 0), [lines]);
  const total = Math.max(0, subtotal + Number(meta.tax || 0) - Number(meta.discount || 0));

  const setLine = (i: number, patch: Partial<Line>) => setLines((l) => l.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const onPick = (i: number, pid: string) => {
    const p = products.data?.data.find((x) => x.id === pid);
    setLine(i, { product_id: pid, unit_price: p ? Number((p as any)[priceField]) : 0 });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = lines.filter((l) => l.product_id && l.quantity > 0);
    if (!valid.length) return;
    const body: Record<string, unknown> = {
      items: valid, tax: Number(meta.tax || 0), discount: Number(meta.discount || 0), notes: meta.notes || null,
      [isSale ? 'customer_id' : 'supplier_id']: meta.party_id || null,
      [isSale ? 'invoice_no' : 'reference']: meta.reference || undefined,
      [isSale ? 'sale_date' : 'purchase_date']: meta.date || undefined,
    };
    if (isSale) { body.paid = Number(meta.paid || 0) || total; body.payment_method = meta.payment_method; }
    if (editing) await update.mutateAsync({ id: id!, body });
    else await create.mutateAsync(body);
    navigate(listPath);
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={editing ? `Edit ${singular}` : `New ${singular}`} breadcrumb={[{ label: singular + 's', to: listPath }, { label: editing ? 'Edit' : 'New' }]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">{partyLabel}</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={meta.party_id} onChange={(e) => setMeta((m) => ({ ...m, party_id: e.target.value }))}>
              <option value="">{isSale ? 'Walk-in / none' : '— none —'}</option>
              {parties.data?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{refLabel}</Label>
            <Input value={meta.reference} placeholder="auto" onChange={(e) => setMeta((m) => ({ ...m, reference: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={meta.date} onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-6 space-y-1">
                {i === 0 && <Label className="text-xs">Product</Label>}
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={line.product_id} onChange={(e) => onPick(i, e.target.value)}>
                  <option value="">Select…</option>
                  {products.data?.data.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {Number(p.stock)})</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                {i === 0 && <Label className="text-xs">Qty</Label>}
                <Input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} />
              </div>
              <div className="col-span-3 space-y-1">
                {i === 0 && <Label className="text-xs">Unit price</Label>}
                <Input type="number" min="0" step="0.01" value={line.unit_price} onChange={(e) => setLine(i, { unit_price: Number(e.target.value) })} />
              </div>
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => setLines((l) => l.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setLines((l) => [...l, { product_id: '', quantity: 1, unit_price: 0 }])}>
            <Plus className="h-4 w-4" /> Add line
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">Tax</Label><Input type="number" min="0" step="0.01" value={meta.tax} onChange={(e) => setMeta((m) => ({ ...m, tax: Number(e.target.value) }))} /></div>
          <div className="space-y-1"><Label className="text-xs">Discount</Label><Input type="number" min="0" step="0.01" value={meta.discount} onChange={(e) => setMeta((m) => ({ ...m, discount: Number(e.target.value) }))} /></div>
          {isSale && (
            <div className="space-y-1"><Label className="text-xs">Payment method</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={meta.payment_method} onChange={(e) => setMeta((m) => ({ ...m, payment_method: e.target.value }))}>
                {['cash', 'card', 'bank', 'mobile'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          {isSale && <div className="space-y-1"><Label className="text-xs">Paid</Label><Input type="number" min="0" step="0.01" value={meta.paid} onChange={(e) => setMeta((m) => ({ ...m, paid: Number(e.target.value) }))} /></div>}
          <div className="space-y-1 sm:col-span-3"><Label className="text-xs">Notes</Label><Input value={meta.notes} onChange={(e) => setMeta((m) => ({ ...m, notes: e.target.value }))} /></div>
          <div className="sm:col-span-3 flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Subtotal {formatCurrency(subtotal)} · Grand total</span>
            <span className="text-xl font-bold">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(listPath)}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>{editing ? 'Save changes' : `Save ${singular}`}</Button>
      </div>
    </form>
  );
}
