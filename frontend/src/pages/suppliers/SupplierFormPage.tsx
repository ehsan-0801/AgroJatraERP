import { ResourceFormPage } from '@/components/ResourceFormPage';

export function SupplierFormPage() {
  return (
    <ResourceFormPage
      resource="suppliers"
      singular="Supplier"
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
