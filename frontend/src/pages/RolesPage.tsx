import { Check, Minus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ROLE_LABELS, can, type Module, type Role } from '@/lib/permissions';

const ROLES = Object.keys(ROLE_LABELS) as Role[];
const MODULES: { module: Module; label: string }[] = [
  { module: 'dashboard', label: 'Dashboard' },
  { module: 'products', label: 'Products' },
  { module: 'categories', label: 'Categories' },
  { module: 'customers', label: 'Customers' },
  { module: 'suppliers', label: 'Suppliers' },
  { module: 'purchases', label: 'Purchases' },
  { module: 'sales', label: 'Sales' },
  { module: 'reports', label: 'Reports' },
  { module: 'users', label: 'Users' },
  { module: 'settings', label: 'Settings' },
];

function cell(role: Role, module: Module) {
  const c = can(role, module, 'create'), r = can(role, module, 'read'), u = can(role, module, 'update'), d = can(role, module, 'delete');
  if (c && r && u && d) return <span className="font-medium text-primary">CRUD</span>;
  if (c && u && !d) return <span className="text-blue-500">Create/Edit</span>;
  if (r && !c && !u && !d) return <span className="text-muted-foreground">Read</span>;
  if (r || c || u || d) return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
}

export function RolesPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Roles & Permissions" description="What each system role can do" breadcrumb={[{ label: 'Roles' }]} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Module</th>
                {ROLES.map((r) => <th key={r} className="px-4 py-3 text-center font-medium">{ROLE_LABELS[r]}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {MODULES.map((m) => (
                <tr key={m.module}>
                  <td className="px-4 py-3 font-medium">{m.label}</td>
                  {ROLES.map((r) => <td key={r} className="px-4 py-3 text-center">{cell(r, m.module)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
