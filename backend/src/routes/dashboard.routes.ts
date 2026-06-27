import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth, loadContext, requireOrg);

dashboardRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    const kpis = (await query(
      `select
        (select count(*) from public.products  where organization_id=$1 and deleted_at is null) as total_products,
        (select count(*) from public.customers where organization_id=$1 and deleted_at is null) as total_customers,
        (select count(*) from public.suppliers where organization_id=$1 and deleted_at is null) as total_suppliers,
        (select count(*) from public.purchases where organization_id=$1 and deleted_at is null) as total_purchases,
        (select count(*) from public.sales     where organization_id=$1 and deleted_at is null) as total_sales,
        (select coalesce(sum(total),0) from public.sales     where organization_id=$1 and deleted_at is null) as revenue,
        (select coalesce(sum(stock*purchase_price),0) from public.products where organization_id=$1 and deleted_at is null) as inventory_value,
        (select count(*) from public.products where organization_id=$1 and deleted_at is null and stock <= min_stock) as low_stock`,
      [org],
    )).rows[0];

    const salesTrend = (await query(
      `select to_char(sale_date,'YYYY-MM-DD') as date, sum(total)::float as total from public.sales
       where organization_id=$1 and deleted_at is null and sale_date >= current_date - interval '30 days' group by 1 order by 1`, [org])).rows;
    const purchaseTrend = (await query(
      `select to_char(purchase_date,'YYYY-MM-DD') as date, sum(total)::float as total from public.purchases
       where organization_id=$1 and deleted_at is null and purchase_date >= current_date - interval '30 days' group by 1 order by 1`, [org])).rows;
    const topProducts = (await query(
      `select pr.name, sum(si.quantity)::float as qty, sum(si.line_total)::float as revenue
       from public.sales_items si join public.sales sa on sa.id=si.sale_id and sa.deleted_at is null and sa.organization_id=$1
       join public.products pr on pr.id=si.product_id group by pr.name order by qty desc limit 5`, [org])).rows;
    const recentSales = (await query(
      `select sa.id, sa.invoice_no, sa.total, sa.sale_date, c.name as customer_name from public.sales sa
       left join public.customers c on c.id=sa.customer_id where sa.organization_id=$1 and sa.deleted_at is null order by sa.created_at desc limit 5`, [org])).rows;
    const recentPurchases = (await query(
      `select p.id, p.reference, p.total, p.purchase_date, s.name as supplier_name from public.purchases p
       left join public.suppliers s on s.id=p.supplier_id where p.organization_id=$1 and p.deleted_at is null order by p.created_at desc limit 5`, [org])).rows;
    const lowStock = (await query(
      `select id, name, sku, stock, min_stock from public.products
       where organization_id=$1 and deleted_at is null and stock <= min_stock order by stock asc limit 8`, [org])).rows;

    res.json({ kpis, salesTrend, purchaseTrend, topProducts, recentSales, recentPurchases, lowStock });
  }),
);
