import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { supabaseAdmin } from '../config/supabase.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg, requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsRouter = Router();
settingsRouter.use(requireAuth, loadContext);

// ── Organization settings (/settings/company) — the active organization ──────
const companySchema = z.object({
  name: z.string().min(1).optional(),
  logo_url: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
}).partial();
const ORG_COLS = ['name', 'logo_url', 'phone', 'email', 'address', 'currency', 'timezone', 'language'];

settingsRouter.get('/company', requireOrg, requirePermission('settings', 'read'), asyncHandler(async (req, res) => {
  const { rows } = await query('select * from public.organizations where id=$1', [req.ctx!.orgId]);
  res.json({ data: rows[0] ?? null });
}));

settingsRouter.patch('/company', requireOrg, requirePermission('settings', 'update'), asyncHandler(async (req, res) => {
  const body = companySchema.parse(req.body) as Record<string, unknown>;
  const cols = ORG_COLS.filter((c) => body[c] !== undefined);
  if (!cols.length) { const { rows } = await query('select * from public.organizations where id=$1', [req.ctx!.orgId]); return res.json({ data: rows[0] }); }
  const sets = cols.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await query(`update public.organizations set ${sets.join(', ')} where id=$1 returning *`, [req.ctx!.orgId, ...cols.map((c) => body[c])]);
  await logActivity({ organizationId: req.ctx!.orgId, userId: req.user!.id, action: 'updated', entity: 'organizations', entityId: req.ctx!.orgId!, description: 'Updated organization settings' });
  res.json({ data: rows[0] });
}));

// ── Personal profile (/settings/profile) — any authenticated user ────────────
const profileSchema = z.object({
  full_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
}).partial();
const PROFILE_COLS = ['full_name', 'phone', 'avatar_url', 'theme'];

settingsRouter.patch('/profile', asyncHandler(async (req, res) => {
  const body = profileSchema.parse(req.body) as Record<string, unknown>;
  const cols = PROFILE_COLS.filter((c) => body[c] !== undefined);
  if (!cols.length) { const { rows } = await query('select * from public.users where id=$1', [req.user!.id]); return res.json({ data: rows[0] }); }
  const sets = cols.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await query(`update public.users set ${sets.join(', ')} where id=$1 returning *`, [req.user!.id, ...cols.map((c) => body[c])]);
  res.json({ data: rows[0] });
}));

// ── Security (/settings/security) — change own password ─────────────────────
settingsRouter.patch('/security', asyncHandler(async (req, res) => {
  const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, { password });
  if (error) throw new Error(error.message);
  await logActivity({ organizationId: req.ctx?.orgId ?? null, userId: req.user!.id, action: 'updated', entity: 'security', description: 'Changed password' });
  res.json({ message: 'Password updated' });
}));
