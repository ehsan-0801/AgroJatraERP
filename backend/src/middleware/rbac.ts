import type { NextFunction, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { ApiError } from '../utils/ApiError.js';
import { can, type Action, type Module, type Role } from '../lib/permissions.js';

export interface Membership {
  organization_id: string;
  organization_name: string;
  role: Role;
}
export interface Ctx {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  memberships: Membership[];
  orgId: string | null;
  role: Role | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx?: Ctx;
    }
  }
}

/** Loads the user's profile, active organization memberships and resolves the
 *  active organization (from the `x-org-id` header, else the first one). */
export async function loadContext(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const profile = (await query<{ is_super_admin: boolean; email: string }>(
      'select email, is_super_admin from public.users where id = $1', [userId],
    )).rows[0];

    const memberships = (await query<Membership>(
      `select m.organization_id, m.role, o.name as organization_name
       from public.memberships m
       join public.organizations o on o.id = m.organization_id
       where m.user_id = $1 and m.status = 'active'
       order by m.created_at asc`,
      [userId],
    )).rows;

    const requested = req.header('x-org-id');
    const active = (requested && memberships.find((m) => m.organization_id === requested)) || memberships[0] || null;

    req.ctx = {
      userId,
      email: req.user!.email ?? profile?.email ?? '',
      isSuperAdmin: Boolean(profile?.is_super_admin),
      memberships,
      orgId: active?.organization_id ?? null,
      role: active?.role ?? null,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires an active organization in context (every business route uses this). */
export function requireOrg(req: Request, _res: Response, next: NextFunction) {
  if (!req.ctx?.orgId) return next(new ApiError(403, 'No active organization. Create or join an organization first.'));
  next();
}

/** Guards a route by the per-organization permission matrix. */
export function requirePermission(module: Module, action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.ctx?.orgId || !req.ctx.role) return next(new ApiError(403, 'No active organization'));
    if (!can(req.ctx.role, module, action)) {
      return next(new ApiError(403, `Your role (${req.ctx.role}) cannot ${action} ${module}`));
    }
    next();
  };
}

/** Platform super-admin only (cross-organization, read-only console). */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.ctx?.isSuperAdmin) return next(new ApiError(403, 'Super admin access required'));
  next();
}

export type { Role };
