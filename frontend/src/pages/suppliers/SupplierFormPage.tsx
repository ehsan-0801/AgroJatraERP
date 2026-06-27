import { useTranslation } from 'react-i18next';
import { ResourceFormPage } from '@/components/ResourceFormPage';

export function SupplierFormPage() {
  const { t } = useTranslation();
  return (
    <ResourceFormPage
      resource="suppliers"
      singular={t('modules.suppliers.title')}
      listPath="/suppliers"
      fields={[
        { name: 'name', label: 'Name', required: true, section: 'General Information' },
        { name: 'phone', label: 'Phone', section: 'General Information' },
        { name: 'email', label: 'Email', type: 'email', section: 'General Information' },
        { name: 'address', label: 'Address', type: 'textarea', section: 'General Information' },
        { name: 'notes', label: 'Notes', type: 'textarea', section: 'Additional Information' },
      ]}
    />
  );
}
