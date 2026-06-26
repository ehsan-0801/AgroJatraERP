import type { NextFunction, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { ApiError } from '../utils/ApiError.js';
import { can, type Action, type Module, type Role } from '../lib/permissions.js';

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: 'active' | 'inactive';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: AppUser;
    }
  }
}

/** Loads the authenticated user's profile (role + status) onto the request. */
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const { rows } = await query<AppUser>(
      'select id, email, full_name, role, status from public.users where id = $1',
      [req.user!.id],
    );
    const u = rows[0];
    if (!u) throw new ApiError(403, 'No profile found for this account');
    if (u.status !== 'active') throw new ApiError(403, 'Your account is inactive. Contact an administrator.');
    req.appUser = u;
    next();
  } catch (err) {
    next(err);
  }
}

/** Guards a route by the permission matrix. */
export function requirePermission(module: Module, action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.appUser?.role;
    if (!role) return next(new ApiError(403, 'Forbidden'));
    if (!can(role, module, action)) {
      return next(new ApiError(403, `Your role (${role}) cannot ${action} ${module}`));
    }
    next();
  };
}

export type { Role };
