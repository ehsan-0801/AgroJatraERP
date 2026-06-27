import { useTranslation } from 'react-i18next';
import { ResourceFormPage } from '@/components/ResourceFormPage';

export function CategoryFormPage() {
  const { t } = useTranslation();
  return (
    <ResourceFormPage
      resource="categories"
      singular={t('modules.categories.title')}
      listPath="/categories"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'image_url', label: 'Category Image', type: 'image', full: true },
      ]}
    />
  );
}
