import { crudRouter, z } from './crudFactory.js';

const base = {
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  unit: z.string().optional(),
  purchase_price: z.number().nonnegative(),
  selling_price: z.number().nonnegative(),
  stock: z.number().nonnegative().optional(),
  min_stock: z.number().nonnegative().optional(),
  image_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
};

const createSchema = z
  .object(base)
  .refine((d) => d.selling_price >= d.purchase_price, {
    message: 'Selling price must be greater than or equal to purchase price',
    path: ['selling_price'],
  });

export const productsRouter = crudRouter({
  table: 'products',
  module: 'products',
  columns: ['name', 'sku', 'barcode', 'category_id', 'unit', 'purchase_price', 'selling_price', 'stock', 'min_stock', 'image_url', 'status'],
  searchable: ['name', 'sku', 'barcode'],
  sortable: ['name', 'sku', 'purchase_price', 'selling_price', 'stock', 'created_at', 'updated_at'],
  createSchema,
  updateSchema: z.object(base).partial(),
  filters: [
    { param: 'category_id', column: 'category_id' },
    { param: 'status', column: 'status' },
  ],
  selectExtra: 'c.name as category_name',
  joins: 'left join public.categories c on c.id = t.category_id',
});
