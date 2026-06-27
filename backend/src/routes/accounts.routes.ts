import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg, requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const accountsRouter = Router();
accountsRouter.use(requireAuth, loadContext, requireOrg, requirePermission('accounts', 'read'));

const range = (req: { query: Record<string, unknown> }) => ({
  from: String(req.query.from ?? '1900-01-01'),
  to: String(req.query.to ?? '9999-12-31'),
});

// GET /accounts/summary — financial totals + monthly trend for a date range
accountsRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const { from, to } = range(req);
    const org = req.ctx!.orgId;

    const sales = (await query(
      `select count(*)::int as count,
              coalesce(sum(total),0)::float    as total,
              coalesce(sum(subtotal),0)::float as subtotal,
              coalesce(sum(tax),0)::float      as tax,
              coalesce(sum(discount),0)::float as discount,
              coalesce(sum(paid),0)::float     as paid,
              coalesce(sum(total - paid),0)::float as due
       from public.sales where organization_id=$3 and deleted_at is null and sale_date between $1 and $2`,
      [from, to, org],
    )).rows[0];

    const purchases = (await query(
      `select count(*)::int as count,
              coalesce(sum(total),0)::float    as total,
              coalesce(sum(subtotal),0)::float as subtotal,
              coalesce(sum(tax),0)::float      as tax,
              coalesce(sum(discount),0)::float as discount
       from public.purchases where organization_id=$3 and deleted_at is null and purchase_date between $1 and $2`,
      [from, to, org],
    )).rows[0];

    // Cost of goods sold = qty sold × that product's purchase price
    const cogs = Number((await query(
      `select coalesce(sum(si.quantity * p.purchase_price),0)::float as cogs
       from public.sales_items si
       join public.sales s on s.id = si.sale_id and s.deleted_at is null and s.organization_id=$3 and s.sale_date between $1 and $2
       join public.products p on p.id = si.product_id`,
      [from, to, org],
    )).rows[0].cogs);

    // Current receivables across this org's customers (not range-bound)
    const receivable = Number((await query(
      `select coalesce(sum(outstanding_due),0)::float as due from public.customers where organization_id=$1 and deleted_at is null`,
      [org],
    )).rows[0].due);

    const grossProfit = sales.total - cogs;

    // Monthly revenue vs expense (last 12 months)
    const salesByMonth = (await query(
      `select to_char(sale_date,'YYYY-MM') as month, sum(total)::float as v from public.sales
       where organization_id=$1 and deleted_at is null and sale_date >= date_trunc('month', current_date) - interval '11 months'
       group by 1`, [org],
    )).rows;
    const purchasesByMonth = (await query(
      `select to_char(purchase_date,'YYYY-MM') as month, sum(total)::float as v from public.purchases
       where organization_id=$1 and deleted_at is null and purchase_date >= date_trunc('month', current_date) - interval '11 months'
       group by 1`, [org],
    )).rows;

    const months: string[] = [];
    const now = new Date(`${new Date().toISOString().slice(0, 7)}-01T00:00:00Z`);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }
    const sMap = new Map(salesByMonth.map((r) => [r.month, r.v]));
    const pMap = new Map(purchasesByMonth.map((r) => [r.month, r.v]));
    const monthly = months.map((m) => ({ month: m, revenue: sMap.get(m) ?? 0, expense: pMap.get(m) ?? 0 }));

    res.json({
      range: { from, to },
      sales,
      purchases,
      cogs,
      grossProfit,
      netCashflow: sales.paid - purchases.total,
      receivable,
      monthly,
    });
  }),
);

// GET /accounts/ledger — combined sales (money in) + purchases (money out)
accountsRouter.get(
  '/ledger',
  asyncHandler(async (req, res) => {
    const { from, to } = range(req);
    const org = req.ctx!.orgId;
    const type = String(req.query.type ?? ''); // '', 'sale', 'purchase'
    const parts: string[] = [];
    if (type !== 'purchase') {
      parts.push(
        `select 'sale' as type, s.id, s.invoice_no as reference, s.sale_date as date,
                c.name as party, s.total::float as total, s.paid::float as paid
         from public.sales s left join public.customers c on c.id = s.customer_id
         where s.organization_id=$3 and s.deleted_at is null and s.sale_date between $1 and $2`,
      );
    }
    if (type !== 'sale') {
      parts.push(
        `select 'purchase' as type, p.id, p.reference, p.purchase_date as date,
                su.name as party, p.total::float as total, p.total::float as paid
         from public.purchases p left join public.suppliers su on su.id = p.supplier_id
         where p.organization_id=$3 and p.deleted_at is null and p.purchase_date between $1 and $2`,
      );
    }
    const sql = `${parts.join(' union all ')} order by date desc, type limit 500`;
    const { rows } = await query(sql, [from, to, org]);
    res.json({ data: rows });
  }),
);
