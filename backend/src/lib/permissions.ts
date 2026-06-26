// ============================================================================
//  AgroJatra ERP — Role-Based Access Control (single company, 6 system roles)
//  This is the single source of truth for the permission matrix. The frontend
//  mirrors it in src/lib/permissions.ts — keep them in sync.
// ============================================================================

export type Role =
  | 'super_admin'
  | 'admin'
  | 'inventory_manager'
  | 'sales_manager'
  | 'accountant'
  | 'viewer';

export const ROLES: Role[] = [
  'super_admin',
  'admin',
  'inventory_manager',
  'sales_manager',
  'accountant',
  'viewer',
];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  inventory_manager: 'Inventory Manager',
  sales_manager: 'Sales Manager',
  accountant: 'Accountant',
  viewer: 'Viewer',
};

export type Module =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'sales'
  | 'reports'
  | 'users'
  | 'settings';

export type Action = 'create' | 'read' | 'update' | 'delete';

const ALL: Action[] = ['create', 'read', 'update', 'delete'];
const CE: Action[] = ['create', 'read', 'update']; // create/edit, no delete
const R: Action[] = ['read'];
const NONE: Action[] = [];

// Module → Role → allowed actions. Mirrors the spec's permission matrix.
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
  // settings: super admin full; admin limited (read + update company); others none
  settings:  { super_admin: ALL, admin: ['read', 'update'], inventory_manager: NONE, sales_manager: NONE, accountant: NONE, viewer: NONE },
};

/** Can `role` perform `action` on `module`? */
export function can(role: Role, module: Module, action: Action): boolean {
  return MATRIX[module]?.[role]?.includes(action) ?? false;
}

/** Which report categories a role may view. */
export const REPORT_ACCESS: Record<Role, string[]> = {
  super_admin: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
  admin: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
  inventory_manager: ['products', 'suppliers', 'purchases'],
  sales_manager: ['sales', 'customers'],
  accountant: ['purchases', 'sales'],
  viewer: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
};

export function canViewReport(role: Role, type: string): boolean {
  return REPORT_ACCESS[role]?.includes(type) ?? false;
}
