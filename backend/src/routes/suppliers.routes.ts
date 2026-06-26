import { crudRouter, z } from './crudFactory.js';

const base = {
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
};

export const suppliersRouter = crudRouter({
  table: 'suppliers',
  module: 'suppliers',
  columns: ['name', 'email', 'phone', 'address', 'notes'],
  searchable: ['name', 'email', 'phone'],
  sortable: ['name', 'created_at', 'updated_at'],
  createSchema: z.object(base),
  updateSchema: z.object(base).partial(),
});
