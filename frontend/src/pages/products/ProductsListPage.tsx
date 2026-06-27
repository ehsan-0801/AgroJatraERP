import { useTranslation } from 'react-i18next';
import { ResourceListPage } from '@/components/ResourceListPage';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string; name: string; sku: string; category_name: string | null;
  purchase_price: string; selling_price: string; stock: string; min_stock: string; status: string;
}

export function ProductsListPage() {
  const { t } = useTranslation();
  return (
    <ResourceListPage<Product>
      module="products"
      resource="products"
      title={t('modules.products.title')}
      description={t('modules.products.desc')}
      singular={t('modules.products.title')}
      basePath="/products"
      hasDetail
      searchPlaceholder="Search by name, SKU, barcode…"
      filters={[
        { param: 'category_id', label: 'Category', optionsResource: 'categories' },
        { param: 'status', label: 'Status', options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] },
      ]}
      exportRows={(rows) => rows.map((p) => ({
        name: p.name, sku: p.sku, category: p.category_name ?? '', purchase_price: p.purchase_price,
        selling_price: p.selling_price, stock: p.stock, status: p.status,
      }))}
      columns={[
        { header: 'Name', render: (p) => <span className="font-medium">{p.name}</span> },
        { header: 'SKU', render: (p) => <span className="text-muted-foreground">{p.sku}</span> },
        { header: 'Category', render: (p) => p.category_name ?? '—' },
        { header: 'Purchase', className: 'text-right', render: (p) => formatCurrency(p.purchase_price) },
        { header: 'Selling', className: 'text-right', render: (p) => formatCurrency(p.selling_price) },
        {
          header: 'Stock', className: 'text-right',
          render: (p) => Number(p.stock) <= Number(p.min_stock)
            ? <Badge variant="destructive">{Number(p.stock)} low</Badge>
            : <Badge variant="success">{Number(p.stock)}</Badge>,
        },
        { header: 'Status', render: (p) => <Badge variant={p.status === 'active' ? 'secondary' : 'destructive'}>{p.status}</Badge> },
      ]}
    />
  );
}
