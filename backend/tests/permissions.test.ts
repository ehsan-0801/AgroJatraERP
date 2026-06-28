import { describe, expect, it } from 'vitest';
import { can, canViewReport, ROLES } from '../src/lib/permissions';

describe('permission matrix', () => {
  it('admin can do everything on every module', () => {
    for (const m of ['products', 'sales', 'users', 'settings', 'accounts'] as const) {
      for (const a of ['create', 'read', 'update', 'delete'] as const) {
        // accounts/reports are read-only even for admin
        if ((m === 'accounts') && a !== 'read') continue;
        expect(can('admin', m, a)).toBe(true);
      }
    }
  });

  it('viewer is read-only and cannot touch admin modules', () => {
    expect(can('viewer', 'products', 'read')).toBe(true);
    expect(can('viewer', 'products', 'create')).toBe(false);
    expect(can('viewer', 'users', 'read')).toBe(false);
    expect(can('viewer', 'settings', 'read')).toBe(false);
  });

  it('inventory manager manages stock but not sales or members', () => {
    expect(can('inventory_manager', 'products', 'update')).toBe(true);
    expect(can('inventory_manager', 'products', 'delete')).toBe(false); // create/edit only
    expect(can('inventory_manager', 'sales', 'create')).toBe(false);
    expect(can('inventory_manager', 'users', 'create')).toBe(false);
  });

  it('sales manager manages sales & customers but not products', () => {
    expect(can('sales_manager', 'sales', 'create')).toBe(true);
    expect(can('sales_manager', 'customers', 'update')).toBe(true);
    expect(can('sales_manager', 'products', 'create')).toBe(false);
  });

  it('only admin and accountant can read accounts', () => {
    expect(can('accountant', 'accounts', 'read')).toBe(true);
    expect(can('admin', 'accounts', 'read')).toBe(true);
    expect(can('sales_manager', 'accounts', 'read')).toBe(false);
    expect(can('viewer', 'accounts', 'read')).toBe(false);
  });

  it('only admin manages members and settings', () => {
    expect(can('admin', 'users', 'create')).toBe(true);
    for (const r of ROLES.filter((r) => r !== 'admin')) {
      expect(can(r, 'users', 'create')).toBe(false);
      expect(can(r, 'settings', 'update')).toBe(false);
    }
  });

  it('report access is role-scoped', () => {
    expect(canViewReport('inventory_manager', 'products')).toBe(true);
    expect(canViewReport('inventory_manager', 'sales')).toBe(false);
    expect(canViewReport('sales_manager', 'sales')).toBe(true);
    expect(canViewReport('accountant', 'purchases')).toBe(true);
  });
});
