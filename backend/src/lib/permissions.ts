// ============================================================================
//  AgroJatra ERP — Role-Based Access Control (single company, 6 system roles)
//  This is the single source of truth for the permission matrix. The frontend
//  mirrors it in src/lib/permissions.ts — keep them in sync.
// ============================================================================

export type Role =
  | 'admin'
  | 'inventory_manager'
  | 'sales_manager'
  | 'accountant'
  | 'viewer';

export const ROLES: Role[] = [
  'admin',
  'inventory_manager',
  'sales_manager',
  'accountant',
  'viewer',
];

export const ROLE_LABELS: Record<Role, string> = {
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
  | 'accounts'
  | 'users'
  | 'settings';

export type Action = 'create' | 'read' | 'update' | 'delete';

const ALL: Action[] = ['create', 'read', 'update', 'delete'];
const CE: Action[] = ['create', 'read', 'update']; // create/edit, no delete
const R: Action[] = ['read'];
const NONE: Action[] = [];

// Module → Role → allowed actions. Mirrors the spec's permission matrix.
const MATRIX: Record<Module, Record<Role, Action[]>> = {
  dashboard: { admin: R,   inventory_manager: R,   sales_manager: R,   accountant: R, viewer: R },
  products:  { admin: ALL, inventory_manager: CE,  sales_manager: R,   accountant: R, viewer: R },
  categories:{ admin: ALL, inventory_manager: CE,  sales_manager: R,   accountant: R, viewer: R },
  customers: { admin: ALL, inventory_manager: R,   sales_manager: ALL, accountant: R, viewer: R },
  suppliers: { admin: ALL, inventory_manager: ALL, sales_manager: R,   accountant: R, viewer: R },
  purchases: { admin: ALL, inventory_manager: ALL, sales_manager: R,   accountant: R, viewer: R },
  sales:     { admin: ALL, inventory_manager: R,   sales_manager: ALL, accountant: R, viewer: R },
  reports:   { admin: R,   inventory_manager: R,   sales_manager: R,   accountant: R, viewer: R },
  // accounts: financial summary + ledger — for accountants and admins
  accounts:  { admin: R,   inventory_manager: NONE, sales_manager: NONE, accountant: R, viewer: NONE },
  // admin has full control of the system, users and settings
  users:     { admin: ALL, inventory_manager: NONE, sales_manager: NONE, accountant: NONE, viewer: NONE },
  settings:  { admin: ALL, inventory_manager: NONE, sales_manager: NONE, accountant: NONE, viewer: NONE },
};

/** Can `role` perform `action` on `module`? */
export function can(role: Role, module: Module, action: Action): boolean {
  return MATRIX[module]?.[role]?.includes(action) ?? false;
}

/** Which report categories a role may view. */
export const REPORT_ACCESS: Record<Role, string[]> = {
  admin: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
  inventory_manager: ['products', 'suppliers', 'purchases'],
  sales_manager: ['sales', 'customers'],
  accountant: ['purchases', 'sales'],
  viewer: ['products', 'customers', 'suppliers', 'purchases', 'sales'],
};

export function canViewReport(role: Role, type: string): boolean {
  return REPORT_ACCESS[role]?.includes(type) ?? false;
}
