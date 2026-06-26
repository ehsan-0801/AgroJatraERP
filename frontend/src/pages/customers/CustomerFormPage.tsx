import { ResourceFormPage } from '@/components/ResourceFormPage';

export function CustomerFormPage() {
  return (
    <ResourceFormPage
      resource="customers"
      singular="Customer"
      listPath="/customers"
      fields={[
        { name: 'name', label: 'Name', required: true, section: 'General Information' },
        { name: 'phone', label: 'Phone', section: 'General Information' },
        { name: 'email', label: 'Email', type: 'email', section: 'General Information' },
        { name: 'address', label: 'Address', type: 'textarea', section: 'General Information' },
        { name: 'outstanding_due', label: 'Outstanding Due', type: 'number', step: '0.01', section: 'Additional Information' },
        { name: 'notes', label: 'Notes', type: 'textarea', section: 'Additional Information' },
      ]}
    />
  );
}
