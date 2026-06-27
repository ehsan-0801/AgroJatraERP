import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';
import { query } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).optional(),
});

async function ensureProfile(userId: string, email: string, fullName?: string) {
  await query(
    `insert into public.users (id, email, full_name) values ($1,$2,$3)
     on conflict (id) do update set full_name = coalesce(excluded.full_name, public.users.full_name)`,
    [userId, email, fullName ?? null],
  );
}

/** POST /auth/register — open signup. Creates the account; the user then
 *  onboards their organization via POST /organizations. */
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (error || !data.user) throw new ApiError(400, error?.message ?? 'Registration failed');

    await ensureProfile(data.user.id, body.email, body.full_name);
    await logActivity({ userId: data.user.id, action: 'registered', entity: 'users', entityId: data.user.id });

    const { data: session, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
      email: body.email, password: body.password,
    });
    if (signInErr) throw new ApiError(400, signInErr.message);
    res.status(201).json({ user: { id: data.user.id, email: body.email }, session: session.session });
  }),
);

/** POST /auth/login */
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const { data, error } = await supabaseAnon.auth.signInWithPassword(body);
    if (error || !data.session) throw new ApiError(401, 'Invalid email or password');
    await ensureProfile(data.user.id, data.user.email ?? body.email);
    await logActivity({ userId: data.user.id, action: 'login', entity: 'users', entityId: data.user.id });
    res.json({ user: { id: data.user.id, email: data.user.email }, session: data.session });
  }),
);

/** POST /auth/forgot-password */
authRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const origin = req.headers.origin as string | undefined;
    await supabaseAnon.auth.resetPasswordForEmail(email, origin ? { redirectTo: `${origin}/reset-password` } : undefined);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  }),
);

/** POST /auth/reset-password */
authRouter.post(
  '/reset-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, { password });
    if (error) throw new ApiError(400, error.message);
    res.json({ message: 'Password updated' });
  }),
);

/** POST /auth/logout */
authRouter.post('/logout', requireAuth, asyncHandler(async (_req, res) => res.json({ message: 'Logged out' })));

/** GET /auth/me — profile + memberships + active org/role + super-admin flag */
authRouter.get(
  '/me',
  requireAuth,
  loadContext,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select id, email, full_name, phone, avatar_url, theme, is_super_admin from public.users where id=$1',
      [req.user!.id],
    );
    const ctx = req.ctx!;
    res.json({
      user: rows[0] ?? { id: req.user!.id, email: req.user!.email },
      memberships: ctx.memberships,
      activeOrgId: ctx.orgId,
      role: ctx.role,
      isSuperAdmin: ctx.isSuperAdmin,
      needsOnboarding: !ctx.isSuperAdmin && ctx.memberships.length === 0,
    });
  }),
);
