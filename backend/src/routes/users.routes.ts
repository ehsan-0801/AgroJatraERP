import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { query } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { ROLES, ROLE_LABELS } from '../lib/permissions.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg, requirePermission } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const usersRouter = Router();
usersRouter.use(requireAuth, loadContext, requireOrg);

const roleEnum = z.enum(['admin', 'inventory_manager', 'sales_manager', 'accountant', 'viewer']);
const MEMBER_LIMIT = 5;

// GET /users/roles — the role list (for the Roles view + dropdowns)
usersRouter.get('/roles', requirePermission('users', 'read'), asyncHandler(async (_req, res) => {
  res.json({ roles: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })) });
}));

/** Member list for the active organization. */
usersRouter.get('/', requirePermission('users', 'read'), asyncHandler(async (req, res) => {
  const org = req.ctx!.orgId;
  const { rows } = await query(
    `select m.user_id as id, u.email, u.full_name, u.phone, m.role, m.status, m.created_at,
            (o.owner_id = m.user_id) as is_owner
     from public.memberships m
     join public.users u on u.id = m.user_id
     join public.organizations o on o.id = m.organization_id
     where m.organization_id = $1
     order by (o.owner_id = m.user_id) desc, m.created_at asc`, [org]);
  res.json({ data: rows, total: rows.length, limit: MEMBER_LIMIT, currentUserId: req.user!.id });
}));

usersRouter.get('/:id', requirePermission('users', 'read'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `select m.user_id as id, u.email, u.full_name, u.phone, m.role, m.status, m.created_at
     from public.memberships m join public.users u on u.id=m.user_id
     where m.organization_id=$1 and m.user_id=$2`, [req.ctx!.orgId, req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Not found');
  res.json({ data: rows[0] });
}));

/** Add a member to the active organization (admin creates the account + password). */
usersRouter.post('/', requirePermission('users', 'create'), asyncHandler(async (req, res) => {
  const org = req.ctx!.orgId!;
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    role: roleEnum,
  }).parse(req.body);

  const count = Number((await query<{ c: string }>('select count(*)::int as c from public.memberships where organization_id=$1', [org])).rows[0].c);
  if (count >= MEMBER_LIMIT) throw new ApiError(409, `Member limit reached (${MEMBER_LIMIT} per organization)`);

  // Reuse an existing account if the email is already registered, otherwise create one.
  const existing = (await query<{ id: string }>('select id from public.users where email=$1', [body.email.toLowerCase()])).rows[0];
  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email, password: body.password, email_confirm: true, user_metadata: { full_name: body.full_name },
    });
    if (error || !data.user) throw new ApiError(400, error?.message ?? 'Could not create user');
    userId = data.user.id;
    await query(
      `insert into public.users (id, email, full_name, phone) values ($1,$2,$3,$4)
       on conflict (id) do update set full_name=coalesce(excluded.full_name, public.users.full_name)`,
      [userId, body.email.toLowerCase(), body.full_name ?? null, body.phone ?? null]);
  }

  const already = (await query('select 1 from public.memberships where organization_id=$1 and user_id=$2', [org, userId])).rows[0];
  if (already) throw new ApiError(409, 'This user is already a member of the organization');

  const { rows } = await query(
    `insert into public.memberships (organization_id, user_id, role, status) values ($1,$2,$3,'active')
     returning user_id as id, role, status`,
    [org, userId, body.role]);
  await logActivity({ organizationId: org, userId: req.user!.id, action: 'created', entity: 'users', entityId: userId, description: `Added member ${body.email} (${body.role})` });
  res.status(201).json({ data: { ...rows[0], email: body.email, full_name: body.full_name } });
}));

/** Update a member's role/status (admin). */
usersRouter.patch('/:id', requirePermission('users', 'update'), asyncHandler(async (req, res) => {
  const org = req.ctx!.orgId!;
  const body = z.object({
    full_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    role: roleEnum.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }).parse(req.body);

  const owner = (await query<{ owner_id: string }>('select owner_id from public.organizations where id=$1', [org])).rows[0];
  if (req.params.id === owner.owner_id && (body.role && body.role !== 'admin' || body.status === 'inactive')) {
    throw new ApiError(400, 'The organization owner must remain an active admin');
  }
  if (req.params.id === req.user!.id && (body.role && body.role !== 'admin' || body.status === 'inactive')) {
    throw new ApiError(400, 'You cannot change your own role or deactivate yourself');
  }

  // profile fields live on users; role/status on the membership
  if (body.full_name !== undefined || body.phone !== undefined) {
    await query('update public.users set full_name=coalesce($2,full_name), phone=coalesce($3,phone) where id=$1',
      [req.params.id, body.full_name ?? null, body.phone ?? null]);
  }
  const cols = (['role', 'status'] as const).filter((c) => body[c] !== undefined);
  if (cols.length) {
    const sets = cols.map((c, i) => `${c} = $${i + 3}`);
    const upd = await query(
      `update public.memberships set ${sets.join(', ')} where organization_id=$1 and user_id=$2 returning user_id`,
      [org, req.params.id, ...cols.map((c) => body[c])]);
    if (!upd.rows[0]) throw new ApiError(404, 'Not found');
  }
  const { rows } = await query(
    `select m.user_id as id, u.email, u.full_name, u.phone, m.role, m.status from public.memberships m
     join public.users u on u.id=m.user_id where m.organization_id=$1 and m.user_id=$2`, [org, req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Not found');
  await logActivity({ organizationId: org, userId: req.user!.id, action: 'updated', entity: 'users', entityId: req.params.id, description: `Updated member ${rows[0].email}` });
  res.json({ data: rows[0] });
}));

/** Remove a member from the organization (admin). The account itself is kept. */
usersRouter.delete('/:id', requirePermission('users', 'delete'), asyncHandler(async (req, res) => {
  const org = req.ctx!.orgId!;
  if (req.params.id === req.user!.id) throw new ApiError(400, 'You cannot remove yourself');
  const owner = (await query<{ owner_id: string }>('select owner_id from public.organizations where id=$1', [org])).rows[0];
  if (req.params.id === owner.owner_id) throw new ApiError(400, 'Cannot remove the organization owner');
  const del = await query('delete from public.memberships where organization_id=$1 and user_id=$2 returning user_id', [org, req.params.id]);
  if (!del.rows[0]) throw new ApiError(404, 'Not found');
  await logActivity({ organizationId: org, userId: req.user!.id, action: 'deleted', entity: 'users', entityId: req.params.id, description: 'Removed member' });
  res.json({ message: 'Member removed' });
}));
