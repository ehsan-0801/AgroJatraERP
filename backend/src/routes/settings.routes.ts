import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { supabaseAdmin } from '../config/supabase.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadUser, requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsRouter = Router();
settingsRouter.use(requireAuth, loadUser);

// ── Company settings (/settings/company) ────────────────────────────────────
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
const COMPANY_COLS = ['name', 'logo_url', 'phone', 'email', 'address', 'currency', 'timezone', 'language'];

settingsRouter.get('/company', requirePermission('settings', 'read'), asyncHandler(async (_req, res) => {
  const { rows } = await query('select * from public.company limit 1');
  res.json({ data: rows[0] ?? null });
}));

settingsRouter.patch('/company', requirePermission('settings', 'update'), asyncHandler(async (req, res) => {
  const body = companySchema.parse(req.body) as Record<string, unknown>;
  const cols = COMPANY_COLS.filter((c) => body[c] !== undefined);
  const existing = (await query('select id from public.company limit 1')).rows[0];
  if (!existing) {
    const { rows } = await query('insert into public.company (name) values ($1) returning *', [body.name ?? 'AgroJatra ERP']);
    return res.json({ data: rows[0] });
  }
  if (!cols.length) { const { rows } = await query('select * from public.company limit 1'); return res.json({ data: rows[0] }); }
  const sets = cols.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await query(`update public.company set ${sets.join(', ')} where id=$1 returning *`, [existing.id, ...cols.map((c) => body[c])]);
  await logActivity({ userId: req.user!.id, action: 'updated', entity: 'company', entityId: existing.id, description: 'Updated company settings' });
  res.json({ data: rows[0] });
}));

// ── Personal profile (/settings/profile) — any active user ──────────────────
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
  await logActivity({ userId: req.user!.id, action: 'updated', entity: 'security', description: 'Changed password' });
  res.json({ message: 'Password updated' });
}));
