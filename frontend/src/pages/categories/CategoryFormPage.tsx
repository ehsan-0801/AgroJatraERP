import { ResourceFormPage } from '@/components/ResourceFormPage';

export function CategoryFormPage() {
  return (
    <ResourceFormPage
      resource="categories"
      singular="Category"
      listPath="/categories"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  );
}
