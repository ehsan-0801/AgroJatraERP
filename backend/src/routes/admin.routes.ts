import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireSuperAdmin } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Platform super-admin console — read-only visibility across every organization.
export const adminRouter = Router();
adminRouter.use(requireAuth, loadContext, requireSuperAdmin);

// GET /admin/overview — platform-wide totals
adminRouter.get('/overview', asyncHandler(async (_req, res) => {
  const totals = (await query(
    `select
      (select count(*) from public.organizations) as organizations,
      (select count(*) from public.users where is_super_admin = false) as users,
      (select count(*) from public.memberships) as memberships,
      (select count(*) from public.products where deleted_at is null) as products,
      (select count(*) from public.sales where deleted_at is null) as sales,
      (select coalesce(sum(total),0)::float from public.sales where deleted_at is null) as revenue`,
  )).rows[0];
  res.json({ totals });
}));

// GET /admin/organizations — every organization with headline counts
adminRouter.get('/organizations', asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `select o.*, ou.email as owner_email, ou.full_name as owner_name,
            (select count(*) from public.memberships m where m.organization_id=o.id)::int as members,
            (select count(*) from public.products p where p.organization_id=o.id and p.deleted_at is null)::int as products,
            (select count(*) from public.sales s where s.organization_id=o.id and s.deleted_at is null)::int as sales,
            (select coalesce(sum(total),0)::float from public.sales s where s.organization_id=o.id and s.deleted_at is null) as revenue
     from public.organizations o
     left join public.users ou on ou.id = o.owner_id
     order by o.created_at desc`,
  );
  res.json({ data: rows });
}));

// GET /admin/organizations/:id — one org with its members + data counts
adminRouter.get('/organizations/:id', asyncHandler(async (req, res) => {
  const org = (await query('select * from public.organizations where id=$1', [req.params.id])).rows[0];
  if (!org) throw new ApiError(404, 'Organization not found');
  const members = (await query(
    `select m.user_id as id, u.email, u.full_name, m.role, m.status, m.created_at,
            (o.owner_id = m.user_id) as is_owner
     from public.memberships m join public.users u on u.id=m.user_id
     join public.organizations o on o.id=m.organization_id
     where m.organization_id=$1 order by (o.owner_id=m.user_id) desc, m.created_at asc`, [req.params.id])).rows;
  const counts = (await query(
    `select
      (select count(*) from public.products   where organization_id=$1 and deleted_at is null)::int as products,
      (select count(*) from public.categories where organization_id=$1 and deleted_at is null)::int as categories,
      (select count(*) from public.customers  where organization_id=$1 and deleted_at is null)::int as customers,
      (select count(*) from public.suppliers  where organization_id=$1 and deleted_at is null)::int as suppliers,
      (select count(*) from public.purchases  where organization_id=$1 and deleted_at is null)::int as purchases,
      (select count(*) from public.sales      where organization_id=$1 and deleted_at is null)::int as sales,
      (select coalesce(sum(total),0)::float from public.sales where organization_id=$1 and deleted_at is null) as revenue`,
    [req.params.id])).rows[0];
  const recentSales = (await query(
    `select sa.id, sa.invoice_no, sa.total, sa.sale_date, c.name as customer_name from public.sales sa
     left join public.customers c on c.id=sa.customer_id
     where sa.organization_id=$1 and sa.deleted_at is null order by sa.created_at desc limit 10`, [req.params.id])).rows;
  res.json({ data: { organization: org, members, counts, recentSales } });
}));

// GET /admin/data/:entity — business records across ALL organizations, each
// tagged with its organization, optionally filtered by ?organization_id=.
const ENTITIES: Record<string, { sql: string; order: string }> = {
  products: {
    sql: `select p.id, p.name, p.sku, p.stock, p.selling_price, p.purchase_price, p.status,
                 c.name as category, o.id as organization_id, o.name as organization_name
          from public.products p
          join public.organizations o on o.id = p.organization_id
          left join public.categories c on c.id = p.category_id
          where p.deleted_at is null`,
    order: 'o.name, p.name',
  },
  categories: {
    sql: `select c.id, c.name, c.description,
                 (select count(*) from public.products p where p.category_id=c.id and p.deleted_at is null)::int as products,
                 o.id as organization_id, o.name as organization_name
          from public.categories c
          join public.organizations o on o.id = c.organization_id
          where c.deleted_at is null`,
    order: 'o.name, c.name',
  },
  customers: {
    sql: `select c.id, c.name, c.phone, c.email, c.outstanding_due,
                 o.id as organization_id, o.name as organization_name
          from public.customers c
          join public.organizations o on o.id = c.organization_id
          where c.deleted_at is null`,
    order: 'o.name, c.name',
  },
  suppliers: {
    sql: `select s.id, s.name, s.phone, s.email,
                 o.id as organization_id, o.name as organization_name
          from public.suppliers s
          join public.organizations o on o.id = s.organization_id
          where s.deleted_at is null`,
    order: 'o.name, s.name',
  },
};

adminRouter.get('/data/:entity', asyncHandler(async (req, res) => {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) throw new ApiError(404, 'Unknown entity');
  const params: unknown[] = [];
  let sql = cfg.sql;
  if (req.query.organization_id) {
    params.push(req.query.organization_id);
    sql += ` and o.id = $${params.length}`;
  }
  sql += ` order by ${cfg.order} limit 1000`;
  const { rows } = await query(sql, params);
  res.json({ data: rows });
}));

// GET /admin/users — every user and the organizations they belong to
adminRouter.get('/users', asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `select u.id, u.email, u.full_name, u.is_super_admin, u.created_at,
            coalesce(json_agg(json_build_object('organization', o.name, 'role', m.role))
              filter (where m.id is not null), '[]') as memberships
     from public.users u
     left join public.memberships m on m.user_id = u.id
     left join public.organizations o on o.id = m.organization_id
     group by u.id order by u.created_at desc`,
  );
  res.json({ data: rows });
}));
