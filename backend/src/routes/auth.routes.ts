import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';
import { query } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadUser } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).optional(),
});

/** Ensure the singleton company row exists. */
async function ensureCompany() {
  await query(`insert into public.company (name) select 'AgroJatra ERP'
               where not exists (select 1 from public.company)`);
}

/** POST /auth/register — the FIRST user becomes admin; others default to viewer. */
/** GET /auth/registration-status — is self-registration still open? (only until the first user exists) */
authRouter.get(
  '/registration-status',
  asyncHandler(async (_req, res) => {
    const count = Number((await query<{ c: string }>('select count(*)::int as c from public.users')).rows[0].c);
    res.json({ open: count === 0 });
  }),
);

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    await ensureCompany();

    // Single-organization ERP: only the very first account may self-register
    // (it becomes the Admin). After that, an Admin creates users from /users.
    const isFirst = Number((await query<{ c: string }>('select count(*)::int as c from public.users')).rows[0].c) === 0;
    if (!isFirst) throw new ApiError(403, 'Registration is closed. Please contact your administrator for an account.');
    const role = 'admin';

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (error || !data.user) throw new ApiError(400, error?.message ?? 'Registration failed');

    await query(
      `insert into public.users (id, email, full_name, role, status)
       values ($1,$2,$3,$4,'active')
       on conflict (id) do update set full_name = excluded.full_name`,
      [data.user.id, body.email, body.full_name ?? null, role],
    );
    await logActivity({ userId: data.user.id, action: 'registered', entity: 'users', entityId: data.user.id, description: `${body.email} registered as ${role} (first user)` });

    const { data: session, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (signInErr) throw new ApiError(400, signInErr.message);

    res.status(201).json({ user: { id: data.user.id, email: body.email, role }, session: session.session });
  }),
);

/** POST /auth/login */
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const { data, error } = await supabaseAnon.auth.signInWithPassword(body);
    if (error || !data.session) throw new ApiError(401, 'Invalid email or password');

    // ensure a profile row exists (active, viewer by default)
    await ensureCompany();
    await query(
      `insert into public.users (id, email) values ($1,$2) on conflict (id) do nothing`,
      [data.user.id, data.user.email ?? body.email],
    );
    const profile = (await query('select status from public.users where id=$1', [data.user.id])).rows[0];
    if (profile?.status === 'inactive') throw new ApiError(403, 'Your account is inactive. Contact an administrator.');

    await logActivity({ userId: data.user.id, action: 'login', entity: 'users', entityId: data.user.id });
    res.json({ user: { id: data.user.id, email: data.user.email }, session: data.session });
  }),
);

/** POST /auth/forgot-password */
authRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const redirectTo = (req.headers.origin as string) ?? undefined;
    await supabaseAnon.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo: `${redirectTo}/reset-password` } : undefined);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  }),
);

/** POST /auth/reset-password — set a new password for the authenticated (recovery) session. */
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

/** GET /auth/me — profile + role */
authRouter.get(
  '/me',
  requireAuth,
  loadUser,
  asyncHandler(async (req, res) => {
    const { rows } = await query('select id, email, full_name, phone, avatar_url, role, status, theme from public.users where id=$1', [req.user!.id]);
    res.json({ user: rows[0], role: req.appUser!.role });
  }),
);
