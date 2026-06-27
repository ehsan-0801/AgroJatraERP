import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { query } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { ROLES, ROLE_LABELS } from '../lib/permissions.js';
import { requireAuth } from '../middleware/auth.js';
import { loadUser, requirePermission } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePaging } from '../utils/parsePaging.js';

export const usersRouter = Router();
usersRouter.use(requireAuth, loadUser);

const roleEnum = z.enum(['admin', 'inventory_manager', 'sales_manager', 'accountant', 'viewer']);

// GET /users/roles — the permission matrix (for the Roles view)
usersRouter.get('/roles', requirePermission('users', 'read'), asyncHandler(async (_req, res) => {
  res.json({ roles: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })) });
}));

usersRouter.get('/', requirePermission('users', 'read'), asyncHandler(async (req, res) => {
  const p = parsePaging(req, ['created_at', 'email', 'role'], 'created_at');
  const params: unknown[] = [];
  let where = '1=1';
  if (p.search) { params.push(`%${p.search}%`); where += ` and (email ilike $${params.length} or full_name ilike $${params.length})`; }
  if (req.query.role) { params.push(req.query.role); where += ` and role = $${params.length}`; }
  const total = Number((await query<{ count: string }>(`select count(*)::int as count from public.users where ${where}`, params)).rows[0].count);
  params.push(p.limit, p.offset);
  const { rows } = await query(
    `select id, email, full_name, phone, role, status, created_at from public.users
     where ${where} order by ${p.sort} ${p.order} limit $${params.length - 1} offset $${params.length}`, params);
  res.json({ data: rows, page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit), currentUserId: req.user!.id });
}));

usersRouter.get('/:id', requirePermission('users', 'read'), asyncHandler(async (req, res) => {
  const { rows } = await query('select id, email, full_name, phone, role, status, created_at from public.users where id=$1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Not found');
  res.json({ data: rows[0] });
}));

usersRouter.post('/', requirePermission('users', 'create'), asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    role: roleEnum,
  }).parse(req.body);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: body.email, password: body.password, email_confirm: true, user_metadata: { full_name: body.full_name },
  });
  if (error || !data.user) throw new ApiError(400, error?.message ?? 'Could not create user');
  const { rows } = await query(
    `insert into public.users (id, email, full_name, phone, role, status) values ($1,$2,$3,$4,$5,'active')
     on conflict (id) do update set full_name=excluded.full_name, role=excluded.role
     returning id, email, full_name, phone, role, status`,
    [data.user.id, body.email, body.full_name ?? null, body.phone ?? null, body.role]);
  await logActivity({ userId: req.user!.id, action: 'created', entity: 'users', entityId: data.user.id, description: `Created user ${body.email} (${body.role})` });
  res.status(201).json({ data: rows[0] });
}));

usersRouter.patch('/:id', requirePermission('users', 'update'), asyncHandler(async (req, res) => {
  const body = z.object({
    full_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    role: roleEnum.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }).parse(req.body) as Record<string, unknown>;

  // Guard: don't let an admin demote/deactivate themselves into lockout
  if (req.params.id === req.user!.id && ((body.role && body.role !== 'admin') || body.status === 'inactive')) {
    throw new ApiError(400, 'You cannot change your own role or deactivate yourself');
  }
  const cols = ['full_name', 'phone', 'role', 'status'].filter((c) => body[c] !== undefined);
  if (!cols.length) throw new ApiError(400, 'No fields to update');
  const sets = cols.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await query(
    `update public.users set ${sets.join(', ')} where id=$1 returning id, email, full_name, phone, role, status`,
    [req.params.id, ...cols.map((c) => body[c])]);
  if (!rows[0]) throw new ApiError(404, 'Not found');
  await logActivity({ userId: req.user!.id, action: 'updated', entity: 'users', entityId: req.params.id, description: `Updated user ${rows[0].email}` });
  res.json({ data: rows[0] });
}));

usersRouter.delete('/:id', requirePermission('users', 'delete'), asyncHandler(async (req, res) => {
  if (req.params.id === req.user!.id) throw new ApiError(400, 'You cannot delete your own account');
  const target = (await query('select role from public.users where id=$1', [req.params.id])).rows[0];
  if (!target) throw new ApiError(404, 'Not found');
  if (target.role === 'admin') {
    const others = Number((await query(`select count(*)::int as c from public.users where role='admin' and id<>$1`, [req.params.id])).rows[0].c);
    if (others === 0) throw new ApiError(400, 'Cannot delete the last admin');
  }
  await supabaseAdmin.auth.admin.deleteUser(req.params.id).catch(() => {});
  await query('delete from public.users where id=$1', [req.params.id]);
  await logActivity({ userId: req.user!.id, action: 'deleted', entity: 'users', entityId: req.params.id });
  res.json({ message: 'User deleted' });
}));
