import { ResourceListPage } from '@/components/ResourceListPage';

interface Supplier { id: string; name: string; email: string | null; phone: string | null; address: string | null }

export function SuppliersListPage() {
  return (
    <ResourceListPage<Supplier>
      module="suppliers"
      resource="suppliers"
      title="Suppliers"
      description="Manage your supply-chain partners"
      singular="Supplier"
      basePath="/suppliers"
      hasDetail
      exportRows={(rows) => rows.map((s) => ({ name: s.name, email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '' }))}
      columns={[
        { header: 'Name', render: (s) => <span className="font-medium">{s.name}</span> },
        { header: 'Phone', render: (s) => s.phone ?? '—' },
        { header: 'Email', render: (s) => s.email ?? '—' },
        { header: 'Address', render: (s) => s.address ?? '—' },
      ]}
    />
  );
}
