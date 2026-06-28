import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { computeTotals } from '../lib/calc.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg, requirePermission } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePaging } from '../utils/parsePaging.js';

export const purchasesRouter = Router();
purchasesRouter.use(requireAuth, loadContext, requireOrg);

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});
const createSchema = z.object({
  supplier_id: z.string().uuid().optional().nullable(),
  reference: z.string().min(1).optional(),
  purchase_date: z.string().optional(),
  tax: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
});
const totals = (items: z.infer<typeof itemSchema>[], tax = 0, discount = 0) => computeTotals(items, tax, discount);

purchasesRouter.get(
  '/',
  requirePermission('purchases', 'read'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    const p = parsePaging(req, ['purchase_date', 'total', 'created_at'], 'created_at');
    const params: unknown[] = [org];
    let where = 'p.organization_id = $1 and p.deleted_at is null';
    if (p.search) { params.push(`%${p.search}%`); where += ` and (p.reference ilike $${params.length} or s.name ilike $${params.length})`; }
    if (req.query.supplier_id) { params.push(req.query.supplier_id); where += ` and p.supplier_id = $${params.length}`; }
    const total = Number((await query<{ count: string }>(`select count(*)::int as count from public.purchases p left join public.suppliers s on s.id=p.supplier_id where ${where}`, params)).rows[0].count);
    params.push(p.limit, p.offset);
    const { rows } = await query(
      `select p.*, s.name as supplier_name from public.purchases p
       left join public.suppliers s on s.id=p.supplier_id
       where ${where} order by p.${p.sort} ${p.order} limit $${params.length - 1} offset $${params.length}`,
      params,
    );
    res.json({ data: rows, page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) });
  }),
);

purchasesRouter.get(
  '/:id',
  requirePermission('purchases', 'read'),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select p.*, s.name as supplier_name, u.full_name as created_by_name from public.purchases p
       left join public.suppliers s on s.id=p.supplier_id
       left join public.users u on u.id=p.created_by
       where p.id=$1 and p.organization_id=$2 and p.deleted_at is null`, [req.params.id, req.ctx!.orgId]);
    if (!rows[0]) throw new ApiError(404, 'Not found');
    const items = await query(
      `select pi.*, pr.name as product_name, pr.sku from public.purchase_items pi
       join public.products pr on pr.id=pi.product_id where pi.purchase_id=$1`, [req.params.id]);
    res.json({ data: { ...rows[0], items: items.rows } });
  }),
);

purchasesRouter.post(
  '/',
  requirePermission('purchases', 'create'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    const body = createSchema.parse(req.body);
    const { subtotal, total } = totals(body.items, body.tax ?? 0, body.discount ?? 0);
    const reference = body.reference ?? `PO-${Date.now()}`;
    const result = await withTransaction(async (c) => {
      const purchase = (await c.query(
        `insert into public.purchases (organization_id, supplier_id, created_by, reference, purchase_date, subtotal, tax, discount, total, notes)
         values ($1,$2,$3,$4,coalesce($5,current_date),$6,$7,$8,$9,$10) returning *`,
        [org, body.supplier_id ?? null, req.user!.id, reference, body.purchase_date ?? null, subtotal, body.tax ?? 0, body.discount ?? 0, total, body.notes ?? null])).rows[0];
      for (const it of body.items) {
        const upd = await c.query(`update public.products set stock = stock + $1 where id=$2 and organization_id=$3 and deleted_at is null returning id`, [it.quantity, it.product_id, org]);
        if (!upd.rows[0]) throw new ApiError(400, `Invalid product: ${it.product_id}`);
        await c.query(`insert into public.purchase_items (purchase_id, product_id, quantity, unit_price, line_total) values ($1,$2,$3,$4,$5)`,
          [purchase.id, it.product_id, it.quantity, it.unit_price, it.quantity * it.unit_price]);
      }
      return purchase;
    });
    await logActivity({ organizationId: org, userId: req.user!.id, action: 'created', entity: 'purchases', entityId: result.id, description: `Recorded purchase ${reference}` });
    res.status(201).json({ data: result });
  }),
);

purchasesRouter.patch(
  '/:id',
  requirePermission('purchases', 'update'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    const body = createSchema.parse(req.body);
    const { subtotal, total } = totals(body.items, body.tax ?? 0, body.discount ?? 0);
    const result = await withTransaction(async (c) => {
      const existing = (await c.query(`select id from public.purchases where id=$1 and organization_id=$2 and deleted_at is null for update`, [req.params.id, org])).rows[0];
      if (!existing) throw new ApiError(404, 'Not found');
      const old = (await c.query(`select product_id, quantity from public.purchase_items where purchase_id=$1`, [existing.id])).rows;
      for (const it of old) await c.query(`update public.products set stock = greatest(0, stock - $1) where id=$2 and organization_id=$3`, [it.quantity, it.product_id, org]);
      await c.query(`delete from public.purchase_items where purchase_id=$1`, [existing.id]);
      for (const it of body.items) {
        const upd = await c.query(`update public.products set stock = stock + $1 where id=$2 and organization_id=$3 and deleted_at is null returning id`, [it.quantity, it.product_id, org]);
        if (!upd.rows[0]) throw new ApiError(400, `Invalid product: ${it.product_id}`);
        await c.query(`insert into public.purchase_items (purchase_id, product_id, quantity, unit_price, line_total) values ($1,$2,$3,$4,$5)`,
          [existing.id, it.product_id, it.quantity, it.unit_price, it.quantity * it.unit_price]);
      }
      return (await c.query(
        `update public.purchases set supplier_id=$1, reference=coalesce($2,reference), purchase_date=coalesce($3,purchase_date),
         subtotal=$4, tax=$5, discount=$6, total=$7, notes=$8 where id=$9 returning *`,
        [body.supplier_id ?? null, body.reference ?? null, body.purchase_date ?? null, subtotal, body.tax ?? 0, body.discount ?? 0, total, body.notes ?? null, existing.id])).rows[0];
    });
    await logActivity({ organizationId: org, userId: req.user!.id, action: 'updated', entity: 'purchases', entityId: req.params.id });
    res.json({ data: result });
  }),
);

purchasesRouter.delete(
  '/:id',
  requirePermission('purchases', 'delete'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    await withTransaction(async (c) => {
      const purchase = (await c.query(`select id from public.purchases where id=$1 and organization_id=$2 and deleted_at is null`, [req.params.id, org])).rows[0];
      if (!purchase) throw new ApiError(404, 'Not found');
      const items = (await c.query(`select product_id, quantity from public.purchase_items where purchase_id=$1`, [purchase.id])).rows;
      for (const it of items) await c.query(`update public.products set stock = greatest(0, stock - $1) where id=$2 and organization_id=$3`, [it.quantity, it.product_id, org]);
      await c.query(`update public.purchases set deleted_at=now() where id=$1`, [purchase.id]);
    });
    await logActivity({ organizationId: org, userId: req.user!.id, action: 'deleted', entity: 'purchases', entityId: req.params.id });
    res.json({ message: 'Deleted and stock reversed' });
  }),
);
