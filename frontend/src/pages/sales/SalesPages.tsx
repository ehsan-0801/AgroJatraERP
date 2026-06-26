import { ResourceListPage } from '@/components/ResourceListPage';
import { TransactionDetailPage } from '@/components/TransactionDetailPage';
import { TransactionFormPage } from '@/components/TransactionFormPage';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Sale { id: string; invoice_no: string; customer_name: string | null; sale_date: string; total: string; paid: string }

export function SalesListPage() {
  return (
    <ResourceListPage<Sale>
      module="sales" resource="sales" title="Sales"
      description="Record sales & invoices — stock is validated and deducted"
      singular="Sale" basePath="/sales" hasDetail
      searchPlaceholder="Search by invoice or customer…"
      filters={[{ param: 'customer_id', label: 'Customer', optionsResource: 'customers' }]}
      exportRows={(rows) => rows.map((s) => ({ invoice: s.invoice_no, customer: s.customer_name ?? '', date: s.sale_date, total: s.total, paid: s.paid }))}
      columns={[
        { header: 'Invoice', render: (s) => <span className="font-medium">{s.invoice_no}</span> },
        { header: 'Customer', render: (s) => s.customer_name ?? '—' },
        { header: 'Date', render: (s) => formatDate(s.sale_date) },
        { header: 'Total', className: 'text-right', render: (s) => formatCurrency(s.total) },
        { header: 'Due', className: 'text-right', render: (s) => formatCurrency(Math.max(0, Number(s.total) - Number(s.paid))) },
      ]}
    />
  );
}
export const SaleFormPage = () => <TransactionFormPage kind="sale" />;
export const SaleDetailPage = () => <TransactionDetailPage kind="sale" />;
