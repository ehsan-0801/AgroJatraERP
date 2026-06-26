import { crudRouter, z } from './crudFactory.js';

const base = { name: z.string().min(1), description: z.string().optional().nullable() };

export const categoriesRouter = crudRouter({
  table: 'categories',
  module: 'categories',
  columns: ['name', 'description'],
  searchable: ['name', 'description'],
  sortable: ['name', 'created_at', 'updated_at'],
  createSchema: z.object(base),
  updateSchema: z.object(base).partial(),
});
