import { useTranslation } from 'react-i18next';
import { ResourceFormPage } from '@/components/ResourceFormPage';

export function ProductFormPage() {
  const { t } = useTranslation();
  return (
    <ResourceFormPage
      resource="products"
      singular={t('modules.products.title')}
      listPath="/products"
      fields={[
        { name: 'name', label: 'Name', required: true, section: 'General Information' },
        { name: 'sku', label: 'SKU', required: true, section: 'General Information' },
        { name: 'category_id', label: 'Category', type: 'select', optionsResource: 'categories', section: 'General Information' },
        { name: 'barcode', label: 'Barcode', section: 'General Information' },
        { name: 'unit', label: 'Unit', placeholder: 'pcs / kg / bag', section: 'General Information' },
        { name: 'status', label: 'Status', type: 'select', options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }], section: 'General Information' },
        { name: 'purchase_price', label: 'Purchase Price', type: 'number', step: '0.01', required: true, section: 'Pricing' },
        { name: 'selling_price', label: 'Selling Price', type: 'number', step: '0.01', required: true, section: 'Pricing' },
        { name: 'stock', label: 'Stock', type: 'number', step: '0.01', section: 'Inventory' },
        { name: 'min_stock', label: 'Minimum Stock', type: 'number', step: '0.01', section: 'Inventory' },
        { name: 'image_url', label: 'Product Image', type: 'image', section: 'Inventory', full: true },
      ]}
    />
  );
}
