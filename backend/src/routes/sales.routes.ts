import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { computeTotals, dueOf } from '../lib/calc.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg, requirePermission } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePaging } from '../utils/parsePaging.js';

export const salesRouter = Router();
salesRouter.use(requireAuth, loadContext, requireOrg);

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});
const createSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  invoice_no: z.string().min(1).optional(),
  sale_date: z.string().optional(),
  tax: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  paid: z.number().nonnegative().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
});
const totals = (items: z.infer<typeof itemSchema>[], tax = 0, discount = 0) => computeTotals(items, tax, discount);

salesRouter.get(
  '/',
  requirePermission('sales', 'read'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    const p = parsePaging(req, ['sale_date', 'total', 'created_at'], 'created_at');
    const params: unknown[] = [org];
    let where = 'sa.organization_id = $1 and sa.deleted_at is null';
    if (p.search) { params.push(`%${p.search}%`); where += ` and (sa.invoice_no ilike $${params.length} or c.name ilike $${params.length})`; }
    if (req.query.customer_id) { params.push(req.query.customer_id); where += ` and sa.customer_id = $${params.length}`; }
    const total = Number((await query<{ count: string }>(`select count(*)::int as count from public.sales sa left join public.customers c on c.id=sa.customer_id where ${where}`, params)).rows[0].count);
    params.push(p.limit, p.offset);
    const { rows } = await query(
      `select sa.*, c.name as customer_name from public.sales sa
       left join public.customers c on c.id=sa.customer_id
       where ${where} order by sa.${p.sort} ${p.order} limit $${params.length - 1} offset $${params.length}`, params);
    res.json({ data: rows, page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) });
  }),
);

salesRouter.get(
  '/:id',
  requirePermission('sales', 'read'),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select sa.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, u.full_name as created_by_name
       from public.sales sa left join public.customers c on c.id=sa.customer_id
       left join public.users u on u.id=sa.created_by
       where sa.id=$1 and sa.organization_id=$2 and sa.deleted_at is null`, [req.params.id, req.ctx!.orgId]);
    if (!rows[0]) throw new ApiError(404, 'Not found');
    const items = await query(
      `select si.*, pr.name as product_name, pr.sku from public.sales_items si
       join public.products pr on pr.id=si.product_id where si.sale_id=$1`, [req.params.id]);
    res.json({ data: { ...rows[0], items: items.rows } });
  }),
);

salesRouter.post(
  '/',
  requirePermission('sales', 'create'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    const body = createSchema.parse(req.body);
    const { subtotal, total } = totals(body.items, body.tax ?? 0, body.discount ?? 0);
    const invoiceNo = body.invoice_no ?? `INV-${Date.now()}`;
    const result = await withTransaction(async (c) => {
      const sale = (await c.query(
        `insert into public.sales (organization_id, customer_id, created_by, invoice_no, sale_date, subtotal, tax, discount, total, paid, payment_method, status, notes)
         values ($1,$2,$3,$4,coalesce($5,current_date),$6,$7,$8,$9,$10,$11,'completed',$12) returning *`,
        [org, body.customer_id ?? null, req.user!.id, invoiceNo, body.sale_date ?? null, subtotal, body.tax ?? 0, body.discount ?? 0, total, body.paid ?? total, body.payment_method ?? 'cash', body.notes ?? null])).rows[0];
      for (const it of body.items) {
        const prod = (await c.query(`select id, name, stock from public.products where id=$1 and organization_id=$2 and deleted_at is null for update`, [it.product_id, org])).rows[0];
        if (!prod) throw new ApiError(400, `Invalid product: ${it.product_id}`);
        if (Number(prod.stock) < it.quantity) throw new ApiError(409, `Insufficient stock for "${prod.name}" (have ${prod.stock}, need ${it.quantity})`);
        await c.query(`update public.products set stock = stock - $1 where id=$2 and organization_id=$3`, [it.quantity, it.product_id, org]);
        await c.query(`insert into public.sales_items (sale_id, product_id, quantity, unit_price, line_total) values ($1,$2,$3,$4,$5)`,
          [sale.id, it.product_id, it.quantity, it.unit_price, it.quantity * it.unit_price]);
      }
      const due = dueOf(total, body.paid ?? total);
      if (body.customer_id && due > 0) await c.query(`update public.customers set outstanding_due = outstanding_due + $1 where id=$2 and organization_id=$3`, [due, body.customer_id, org]);
      return sale;
    });
    await logActivity({ organizationId: org, userId: req.user!.id, action: 'created', entity: 'sales', entityId: result.id, description: `Created invoice ${invoiceNo}` });
    res.status(201).json({ data: result });
  }),
);

salesRouter.patch(
  '/:id',
  requirePermission('sales', 'update'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    const body = createSchema.parse(req.body);
    const { subtotal, total } = totals(body.items, body.tax ?? 0, body.discount ?? 0);
    const newPaid = body.paid ?? total;
    const result = await withTransaction(async (c) => {
      const sale = (await c.query(`select * from public.sales where id=$1 and organization_id=$2 and deleted_at is null for update`, [req.params.id, org])).rows[0];
      if (!sale) throw new ApiError(404, 'Not found');
      const old = (await c.query(`select product_id, quantity from public.sales_items where sale_id=$1`, [sale.id])).rows;
      for (const it of old) await c.query(`update public.products set stock = stock + $1 where id=$2 and organization_id=$3`, [it.quantity, it.product_id, org]);
      const oldDue = dueOf(Number(sale.total), Number(sale.paid));
      if (sale.customer_id && oldDue > 0) await c.query(`update public.customers set outstanding_due = greatest(0, outstanding_due - $1) where id=$2 and organization_id=$3`, [oldDue, sale.customer_id, org]);
      await c.query(`delete from public.sales_items where sale_id=$1`, [sale.id]);
      for (const it of body.items) {
        const prod = (await c.query(`select id, name, stock from public.products where id=$1 and organization_id=$2 and deleted_at is null for update`, [it.product_id, org])).rows[0];
        if (!prod) throw new ApiError(400, `Invalid product: ${it.product_id}`);
        if (Number(prod.stock) < it.quantity) throw new ApiError(409, `Insufficient stock for "${prod.name}" (have ${prod.stock}, need ${it.quantity})`);
        await c.query(`update public.products set stock = stock - $1 where id=$2 and organization_id=$3`, [it.quantity, it.product_id, org]);
        await c.query(`insert into public.sales_items (sale_id, product_id, quantity, unit_price, line_total) values ($1,$2,$3,$4,$5)`,
          [sale.id, it.product_id, it.quantity, it.unit_price, it.quantity * it.unit_price]);
      }
      const newDue = dueOf(total, newPaid);
      if (body.customer_id && newDue > 0) await c.query(`update public.customers set outstanding_due = outstanding_due + $1 where id=$2 and organization_id=$3`, [newDue, body.customer_id, org]);
      return (await c.query(
        `update public.sales set customer_id=$1, invoice_no=coalesce($2,invoice_no), sale_date=coalesce($3,sale_date),
         subtotal=$4, tax=$5, discount=$6, total=$7, paid=$8, payment_method=coalesce($9,payment_method), notes=$10 where id=$11 returning *`,
        [body.customer_id ?? null, body.invoice_no ?? null, body.sale_date ?? null, subtotal, body.tax ?? 0, body.discount ?? 0, total, newPaid, body.payment_method ?? null, body.notes ?? null, sale.id])).rows[0];
    });
    await logActivity({ organizationId: org, userId: req.user!.id, action: 'updated', entity: 'sales', entityId: req.params.id });
    res.json({ data: result });
  }),
);

salesRouter.delete(
  '/:id',
  requirePermission('sales', 'delete'),
  asyncHandler(async (req, res) => {
    const org = req.ctx!.orgId;
    await withTransaction(async (c) => {
      const sale = (await c.query(`select id, customer_id, total, paid from public.sales where id=$1 and organization_id=$2 and deleted_at is null for update`, [req.params.id, org])).rows[0];
      if (!sale) throw new ApiError(404, 'Not found');
      const items = (await c.query(`select product_id, quantity from public.sales_items where sale_id=$1`, [sale.id])).rows;
      for (const it of items) await c.query(`update public.products set stock = stock + $1 where id=$2 and organization_id=$3`, [it.quantity, it.product_id, org]);
      const due = dueOf(Number(sale.total), Number(sale.paid));
      if (sale.customer_id && due > 0) await c.query(`update public.customers set outstanding_due = greatest(0, outstanding_due - $1) where id=$2 and organization_id=$3`, [due, sale.customer_id, org]);
      await c.query(`update public.sales set deleted_at=now() where id=$1`, [sale.id]);
    });
    await logActivity({ organizationId: org, userId: req.user!.id, action: 'deleted', entity: 'sales', entityId: req.params.id });
    res.json({ message: 'Deleted, stock restored and dues reversed' });
  }),
);
