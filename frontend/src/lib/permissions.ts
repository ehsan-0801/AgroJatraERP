// Mirror of backend/src/lib/permissions.ts — keep in sync.
export type Role =
  | 'super_admin' | 'admin' | 'inventory_manager' | 'sales_manager' | 'accountant' | 'viewer';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  inventory_manager: 'Inventory Manager',
  sales_manager: 'Sales Manager',
  accountant: 'Accountant',
  viewer: 'Viewer',
};

export type Module =
  | 'dashboard' | 'products' | 'categories' | 'customers' | 'suppliers'
  | 'purchases' | 'sales' | 'reports' | 'users' | 'settings';
export type Action = 'create' | 'read' | 'update' | 'delete';

const ALL: Action[] = ['create', 'read', 'update', 'delete'];
const CE: Action[] = ['create', 'read', 'update'];
const R: Action[] = ['read'];
const NONE: Action[] = [];

const MATRIX: Record<Module, Record<Role, Action[]>> = {
  dashboard: { super_admin: R, admin: R, inventory_manager: R, sales_manager: R, accountant: R, viewer: R },
  products:  { super_admin: ALL, admin: ALL, inventory_manager: CE,  sales_manager: R,   accountant: R, viewer: R },
  categories:{ super_admin: ALL, admin: ALL, inventory_manager: CE,  sales_manager: R,   accountant: R, viewer: R },
  customers: { super_admin: ALL, admin: ALL, inventory_manager: R,   sales_manager: ALL, accountant: R, viewer: R },
  suppliers: { super_admin: ALL, admin: ALL, inventory_manager: ALL, sales_manager: R,   accountant: R, viewer: R },
  purchases: { super_admin: ALL, admin: ALL, inventory_manager: ALL, sales_manager: R,   accountant: R, viewer: R },
  sales:     { super_admin: ALL, admin: ALL, inventory_manager: R,   sales_manager: ALL, accountant: R, viewer: R },
  reports:   { super_admin: R, admin: R, inventory_manager: R, sales_manager: R, accountant: R, viewer: R },
  users:     { super_admin: ALL, admin: NONE, inventory_manager: NONE, sales_manager: NONE, accountant: NONE, viewer: NONE },
  settings:  { super_admin: ALL, admin: ['read', 'update'], inventory_manager: NONE, sales_manager: NONE, accountant: NONE, viewer: NONE },
};

export function can(role: Role | null | undefined, module: Module, action: Action): boolean {
  if (!role) return false;
  return MATRIX[module]?.[role]?.includes(action) ?? false;
}

export const REPORT_ACCESS: Record<Role, string[]> = {
  super_admin: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
  admin: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
  inventory_manager: ['products', 'suppliers', 'purchases'],
  sales_manager: ['sales', 'customers'],
  accountant: ['purchases', 'sales'],
  viewer: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
};
export const canViewReport = (role: Role | null | undefined, type: string) =>
  !!role && REPORT_ACCESS[role]?.includes(type);
/** Export allowed for finance-capable roles. */
export const canExport = (role: Role | null | undefined) =>
  role === 'super_admin' || role === 'admin' || role === 'accountant';
