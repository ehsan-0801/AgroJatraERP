import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

/** Standalone, print-optimized invoice (sale) / purchase order (purchase).
 *  Rendered outside the app shell so "Print / Save as PDF" produces a clean page. */
export function InvoicePage({ kind }: { kind: 'sale' | 'purchase' }) {
  const isSale = kind === 'sale';
  const resource = isSale ? 'sales' : 'purchases';
  const listPath = isSale ? '/sales' : '/purchases';
  const { id } = useParams();

  const { data, isLoading } = useQuery({ queryKey: [resource, 'item', id], queryFn: () => api.get<{ data: any }>(`/${resource}/${id}`) });
  const orgQ = useQuery({ queryKey: ['org', 'current'], queryFn: () => api.get<{ data: any }>('/organizations/current') });

  if (isLoading || !data) return <p className="p-10 text-muted-foreground">Loading…</p>;
  const d = data.data;
  const org = orgQ.data?.data ?? {};
  const cur = org.currency || 'BDT';
  const money = (v: number | string) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(Number(v) || 0);
  const ref = isSale ? d.invoice_no : d.reference;
  const party = isSale ? d.customer_name : d.supplier_name;
  const date = isSale ? d.sale_date : d.purchase_date;
  const due = Math.max(0, Number(d.total) - Number(d.paid ?? d.total));

  return (
    <div className="force-light min-h-screen bg-slate-100 py-8 text-slate-900 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display:none !important } @page { margin: 14mm } body { background: #fff } }`}</style>

      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between px-4">
        <Link to={`${listPath}/${id}`} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Download className="h-4 w-4" /> Download / Print
        </button>
      </div>

      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* header */}
        <div className="flex items-start justify-between border-b pb-6">
          <div className="flex items-center gap-3">
            {org.logo_url ? <img src={org.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : null}
            <div>
              <h1 className="text-xl font-bold">{org.name ?? 'AgroJatra ERP'}</h1>
              <p className="text-xs text-slate-500">{[org.email, org.phone].filter(Boolean).join(' · ')}</p>
              {org.address && <p className="text-xs text-slate-500">{org.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-700">{isSale ? 'Invoice' : 'Purchase Order'}</h2>
            <p className="mt-1 text-sm font-medium">{ref}</p>
            <p className="text-xs text-slate-500">{formatDate(date)}</p>
          </div>
        </div>

        {/* party */}
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">{isSale ? 'Bill to' : 'Supplier'}</p>
          <p className="font-semibold">{party ?? 'Walk-in'}</p>
          {isSale && d.customer_phone && <p className="text-sm text-slate-500">{d.customer_phone}</p>}
          {isSale && d.customer_address && <p className="text-sm text-slate-500">{d.customer_address}</p>}
        </div>

        {/* items */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-y bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit price</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {d.items.map((it: any, i: number) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2">{it.product_name}{it.sku ? <span className="text-xs text-slate-400"> · {it.sku}</span> : null}</td>
                <td className="px-3 py-2 text-right">{Number(it.quantity)}</td>
                <td className="px-3 py-2 text-right">{money(it.unit_price)}</td>
                <td className="px-3 py-2 text-right">{money(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <Row label="Subtotal" value={money(d.subtotal)} />
            <Row label="Tax" value={money(d.tax)} />
            <Row label="Discount" value={`- ${money(d.discount)}`} />
            <Row label="Total" value={money(d.total)} bold />
            {isSale && <><Row label="Paid" value={money(d.paid)} /><Row label="Due" value={money(due)} /></>}
          </div>
        </div>

        {d.notes && <p className="mt-6 border-t pt-4 text-sm text-slate-500">Notes: {d.notes}</p>}
        <p className="mt-8 text-center text-xs text-slate-400">Generated by AgroJatra ERP</p>
      </div>
    </div>
  );
}

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between ${bold ? 'border-t pt-1 text-base font-bold' : ''}`}><span className="text-slate-500">{label}</span><span>{value}</span></div>
);
