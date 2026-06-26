import { ResourceListPage } from '@/components/ResourceListPage';
import { formatDate } from '@/lib/utils';

interface Category { id: string; name: string; description: string | null; created_at: string }

export function CategoriesListPage() {
  return (
    <ResourceListPage<Category>
      module="categories"
      resource="categories"
      title="Categories"
      description="Organize products into categories"
      singular="Category"
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
