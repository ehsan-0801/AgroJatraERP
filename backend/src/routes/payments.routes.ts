import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg, requirePermission } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth, loadContext, requireOrg);

/** GET /payments?customer_id= — payment history (org-scoped). */
paymentsRouter.get('/', requirePermission('customers', 'read'), asyncHandler(async (req, res) => {
  const params: unknown[] = [req.ctx!.orgId];
  let where = 'p.organization_id = $1';
  if (req.query.customer_id) { params.push(req.query.customer_id); where += ` and p.customer_id = $${params.length}`; }
  const { rows } = await query(
    `select p.*, c.name as customer_name, s.invoice_no, u.full_name as created_by_name
     from public.payments p
     left join public.customers c on c.id = p.customer_id
     left join public.sales s on s.id = p.sale_id
     left join public.users u on u.id = p.created_by
     where ${where} order by p.paid_at desc, p.created_at desc limit 200`, params);
  res.json({ data: rows });
}));

/** GET /payments/statement/:customerId — sales (debit) + payments (credit) with running balance. */
paymentsRouter.get('/statement/:customerId', requirePermission('customers', 'read'), asyncHandler(async (req, res) => {
  const org = req.ctx!.orgId;
  const cid = req.params.customerId;
  const customer = (await query('select id, name, phone, outstanding_due from public.customers where id=$1 and organization_id=$2', [cid, org])).rows[0];
  if (!customer) throw new ApiError(404, 'Customer not found');

  const sales = (await query(
    `select id, sale_date as date, invoice_no as ref, total::float as amount from public.sales
     where customer_id=$1 and organization_id=$2 and deleted_at is null`, [cid, org])).rows;
  const payments = (await query(
    `select id, paid_at as date, method as ref, amount::float as amount from public.payments
     where customer_id=$1 and organization_id=$2`, [cid, org])).rows;

  const entries = [
    ...sales.map((s) => ({ date: s.date, type: 'invoice' as const, ref: s.ref, debit: s.amount, credit: 0 })),
    ...payments.map((p) => ({ date: p.date, type: 'payment' as const, ref: p.ref, debit: 0, credit: p.amount })),
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let balance = 0;
  const rows = entries.map((e) => { balance += e.debit - e.credit; return { ...e, balance }; });
  const totalSales = sales.reduce((s, r) => s + r.amount, 0);
  const totalPaid = payments.reduce((s, r) => s + r.amount, 0);

  res.json({ data: { customer, rows, summary: { totalSales, totalPaid, outstanding: Number(customer.outstanding_due) } } });
}));

/** POST /payments — record a customer payment; reduces outstanding due. */
paymentsRouter.post('/', requirePermission('sales', 'create'), asyncHandler(async (req, res) => {
  const org = req.ctx!.orgId!;
  const body = z.object({
    customer_id: z.string().uuid(),
    sale_id: z.string().uuid().optional().nullable(),
    amount: z.number().positive(),
    method: z.string().optional(),
    note: z.string().optional().nullable(),
    paid_at: z.string().optional(),
  }).parse(req.body);

  const result = await withTransaction(async (c) => {
    const customer = (await c.query('select id from public.customers where id=$1 and organization_id=$2 and deleted_at is null for update', [body.customer_id, org])).rows[0];
    if (!customer) throw new ApiError(404, 'Customer not found');
    if (body.sale_id) {
      const sale = (await c.query('select id, total, paid from public.sales where id=$1 and organization_id=$2 and deleted_at is null for update', [body.sale_id, org])).rows[0];
      if (!sale) throw new ApiError(404, 'Invoice not found');
      const newPaid = Math.min(Number(sale.total), Number(sale.paid) + body.amount);
      await c.query('update public.sales set paid=$1 where id=$2', [newPaid, body.sale_id]);
    }
    await c.query('update public.customers set outstanding_due = greatest(0, outstanding_due - $1) where id=$2', [body.amount, body.customer_id]);
    return (await c.query(
      `insert into public.payments (organization_id, customer_id, sale_id, amount, method, note, paid_at, created_by)
       values ($1,$2,$3,$4,coalesce($5,'cash'),$6,coalesce($7,current_date),$8) returning *`,
      [org, body.customer_id, body.sale_id ?? null, body.amount, body.method ?? null, body.note ?? null, body.paid_at ?? null, req.user!.id])).rows[0];
  });
  await logActivity({ organizationId: org, userId: req.user!.id, action: 'created', entity: 'payments', entityId: result.id, description: `Recorded payment ${body.amount}` });
  res.status(201).json({ data: result });
}));
