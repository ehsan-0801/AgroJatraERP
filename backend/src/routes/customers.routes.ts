import { crudRouter, z } from './crudFactory.js';

const base = {
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  outstanding_due: z.number().optional(),
};

export const customersRouter = crudRouter({
  table: 'customers',
  module: 'customers',
  columns: ['name', 'email', 'phone', 'address', 'notes', 'outstanding_due'],
  searchable: ['name', 'email', 'phone'],
  sortable: ['name', 'outstanding_due', 'created_at', 'updated_at'],
  createSchema: z.object(base),
  updateSchema: z.object(base).partial(),
});
