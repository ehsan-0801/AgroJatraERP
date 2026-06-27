import { Router } from 'express';
import { query } from '../db/pool.js';
import { canViewReport } from '../lib/permissions.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reportsRouter = Router();
reportsRouter.use(requireAuth, loadContext, requireOrg);

const range = (req: { query: Record<string, unknown> }) => ({
  from: String(req.query.from ?? '1900-01-01'),
  to: String(req.query.to ?? '9999-12-31'),
});

/** Gate each report by the role's report access list. */
function gate(type: string) {
  return (req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
    if (!req.ctx?.role || !canViewReport(req.ctx.role, type)) return next(new ApiError(403, `Your role cannot view the ${type} report`));
    next();
  };
}

reportsRouter.get('/products', gate('products'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `select p.id, p.name, p.sku, p.stock, p.min_stock, p.purchase_price, p.selling_price,
            (p.stock*p.purchase_price)::float as inventory_value, c.name as category
     from public.products p left join public.categories c on c.id=p.category_id
     where p.organization_id=$1 and p.deleted_at is null order by p.name`, [req.ctx!.orgId]);
  res.json({ data: rows });
}));

reportsRouter.get('/customers', gate('customers'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `select c.id, c.name, c.phone, c.outstanding_due, count(sa.id)::int as total_orders,
            coalesce(sum(sa.total),0)::float as total_spent
     from public.customers c left join public.sales sa on sa.customer_id=c.id and sa.deleted_at is null
     where c.organization_id=$1 and c.deleted_at is null group by c.id order by total_spent desc`, [req.ctx!.orgId]);
  res.json({ data: rows });
}));

reportsRouter.get('/suppliers', gate('suppliers'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `select s.id, s.name, s.phone, count(p.id)::int as total_orders,
            coalesce(sum(p.total),0)::float as total_purchased
     from public.suppliers s left join public.purchases p on p.supplier_id=s.id and p.deleted_at is null
     where s.organization_id=$1 and s.deleted_at is null group by s.id order by total_purchased desc`, [req.ctx!.orgId]);
  res.json({ data: rows });
}));

reportsRouter.get('/purchases', gate('purchases'), asyncHandler(async (req, res) => {
  const { from, to } = range(req);
  const { rows } = await query(
    `select p.id, p.reference, p.purchase_date, p.total, s.name as supplier_name
     from public.purchases p left join public.suppliers s on s.id=p.supplier_id
     where p.organization_id=$3 and p.deleted_at is null and p.purchase_date between $1 and $2 order by p.purchase_date desc`, [from, to, req.ctx!.orgId]);
  res.json({ data: rows });
}));

reportsRouter.get('/sales', gate('sales'), asyncHandler(async (req, res) => {
  const { from, to } = range(req);
  const { rows } = await query(
    `select sa.id, sa.invoice_no, sa.sale_date, sa.total, sa.paid, c.name as customer_name
     from public.sales sa left join public.customers c on c.id=sa.customer_id
     where sa.organization_id=$3 and sa.deleted_at is null and sa.sale_date between $1 and $2 order by sa.sale_date desc`, [from, to, req.ctx!.orgId]);
  res.json({ data: rows });
}));
