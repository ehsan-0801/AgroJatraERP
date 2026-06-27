import { useTranslation } from 'react-i18next';
import { ResourceListPage } from '@/components/ResourceListPage';
import { TransactionDetailPage } from '@/components/TransactionDetailPage';
import { TransactionFormPage } from '@/components/TransactionFormPage';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Purchase { id: string; reference: string; supplier_name: string | null; purchase_date: string; total: string }

export function PurchasesListPage() {
  const { t } = useTranslation();
  return (
    <ResourceListPage<Purchase>
      module="purchases" resource="purchases" title={t('modules.purchases.title')}
      description={t('modules.purchases.desc')}
      singular={t('modules.purchases.title')} basePath="/purchases" hasDetail
      searchPlaceholder="Search by reference or supplier…"
      filters={[{ param: 'supplier_id', label: 'Supplier', optionsResource: 'suppliers' }]}
      exportRows={(rows) => rows.map((p) => ({ reference: p.reference, supplier: p.supplier_name ?? '', date: p.purchase_date, total: p.total }))}
      columns={[
        { header: 'Reference', render: (p) => <span className="font-medium">{p.reference}</span> },
        { header: 'Supplier', render: (p) => p.supplier_name ?? '—' },
        { header: 'Date', render: (p) => formatDate(p.purchase_date) },
        { header: 'Total', className: 'text-right', render: (p) => formatCurrency(p.total) },
      ]}
    />
  );
}
export const PurchaseFormPage = () => <TransactionFormPage kind="purchase" />;
export const PurchaseDetailPage = () => <TransactionDetailPage kind="purchase" />;
