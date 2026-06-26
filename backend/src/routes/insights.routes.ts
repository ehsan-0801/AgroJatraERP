import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadUser, requirePermission } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const insightsRouter = Router();
insightsRouter.use(requireAuth, loadUser);

// GET /insights/product/:id — product + purchase & sales history + stats
insightsRouter.get('/product/:id', requirePermission('products', 'read'), asyncHandler(async (req, res) => {
  const product = (await query(
    `select p.*, c.name as category_name from public.products p
     left join public.categories c on c.id=p.category_id where p.id=$1`, [req.params.id])).rows[0];
  if (!product) throw new ApiError(404, 'Not found');
  const purchaseHistory = (await query(
    `select pi.quantity, pi.unit_price, pi.line_total, pu.reference, pu.purchase_date, s.name as supplier_name
     from public.purchase_items pi join public.purchases pu on pu.id=pi.purchase_id and pu.deleted_at is null
     left join public.suppliers s on s.id=pu.supplier_id where pi.product_id=$1 order by pu.purchase_date desc limit 50`, [req.params.id])).rows;
  const salesHistory = (await query(
    `select si.quantity, si.unit_price, si.line_total, sa.invoice_no, sa.sale_date, c.name as customer_name
     from public.sales_items si join public.sales sa on sa.id=si.sale_id and sa.deleted_at is null
     left join public.customers c on c.id=sa.customer_id where si.product_id=$1 order by sa.sale_date desc limit 50`, [req.params.id])).rows;
  const stats = (await query(
    `select coalesce(sum(si.quantity),0)::float as units_sold, coalesce(sum(si.line_total),0)::float as revenue
     from public.sales_items si join public.sales sa on sa.id=si.sale_id and sa.deleted_at is null where si.product_id=$1`, [req.params.id])).rows[0];
  res.json({ data: { product, purchaseHistory, salesHistory, stats } });
}));

// GET /insights/customer/:id — customer + sales history + stats
insightsRouter.get('/customer/:id', requirePermission('customers', 'read'), asyncHandler(async (req, res) => {
  const customer = (await query('select * from public.customers where id=$1', [req.params.id])).rows[0];
  if (!customer) throw new ApiError(404, 'Not found');
  const sales = (await query(
    `select id, invoice_no, sale_date, total, paid, (total-paid) as due from public.sales
     where customer_id=$1 and deleted_at is null order by sale_date desc limit 50`, [req.params.id])).rows;
  const stats = (await query(
    `select count(*)::int as orders, coalesce(sum(total),0)::float as total_spent from public.sales
     where customer_id=$1 and deleted_at is null`, [req.params.id])).rows[0];
  res.json({ data: { customer, sales, stats } });
}));

// GET /insights/supplier/:id — supplier + purchase history + stats
insightsRouter.get('/supplier/:id', requirePermission('suppliers', 'read'), asyncHandler(async (req, res) => {
  const supplier = (await query('select * from public.suppliers where id=$1', [req.params.id])).rows[0];
  if (!supplier) throw new ApiError(404, 'Not found');
  const purchases = (await query(
    `select id, reference, purchase_date, total from public.purchases
     where supplier_id=$1 and deleted_at is null order by purchase_date desc limit 50`, [req.params.id])).rows;
  const stats = (await query(
    `select count(*)::int as orders, coalesce(sum(total),0)::float as total_purchased from public.purchases
     where supplier_id=$1 and deleted_at is null`, [req.params.id])).rows[0];
  res.json({ data: { supplier, purchases, stats } });
}));
