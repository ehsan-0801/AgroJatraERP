import { useTranslation } from 'react-i18next';
import { ResourceListPage } from '@/components/ResourceListPage';
import { formatCurrency } from '@/lib/utils';

interface Customer { id: string; name: string; email: string | null; phone: string | null; outstanding_due: string }

export function CustomersListPage() {
  const { t } = useTranslation();
  return (
    <ResourceListPage<Customer>
      module="customers"
      resource="customers"
      title={t('modules.customers.title')}
      description={t('modules.customers.desc')}
      singular={t('modules.customers.title')}
      basePath="/customers"
      hasDetail
      exportRows={(rows) => rows.map((c) => ({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', outstanding_due: c.outstanding_due }))}
      columns={[
        { header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
        { header: 'Phone', render: (c) => c.phone ?? '—' },
        { header: 'Email', render: (c) => c.email ?? '—' },
        { header: 'Outstanding', className: 'text-right', render: (c) => formatCurrency(c.outstanding_due) },
      ]}
    />
  );
}
