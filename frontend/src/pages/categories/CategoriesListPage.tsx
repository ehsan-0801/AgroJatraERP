import { useTranslation } from 'react-i18next';
import { ResourceListPage } from '@/components/ResourceListPage';
import { formatDate } from '@/lib/utils';

interface Category { id: string; name: string; description: string | null; created_at: string }

export function CategoriesListPage() {
  const { t } = useTranslation();
  return (
    <ResourceListPage<Category>
      module="categories"
      resource="categories"
      title={t('modules.categories.title')}
      description={t('modules.categories.desc')}
      singular={t('modules.categories.title')}
      basePath="/categories"
      exportRows={(rows) => rows.map((c) => ({ name: c.name, description: c.description ?? '' }))}
      columns={[
        { header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
        { header: 'Description', render: (c) => c.description ?? '—' },
        { header: 'Created', render: (c) => formatDate(c.created_at) },
      ]}
    />
  );
}
