import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadUser, requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const activityRouter = Router();
activityRouter.use(requireAuth, loadUser);

// GET /activity?entity=&entity_id= — timeline for a record (any active user)
// GET /activity (no filter) — global audit log (super admin only)
activityRouter.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const entity = req.query.entity as string | undefined;
    const entityId = req.query.entity_id as string | undefined;
    if (!entityId) {
      // global log → super admin (users read)
      return requirePermission('users', 'read')(req, res, next);
    }
    next();
    void entity;
  }),
  asyncHandler(async (req, res) => {
    const entity = req.query.entity as string | undefined;
    const entityId = req.query.entity_id as string | undefined;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const params: unknown[] = [];
    const clauses: string[] = [];
    if (entity) { params.push(entity); clauses.push(`a.entity = $${params.length}`); }
    if (entityId) { params.push(entityId); clauses.push(`a.entity_id = $${params.length}`); }
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    params.push(limit);
    const { rows } = await query(
      `select a.*, u.full_name as user_name, u.email as user_email
       from public.activity_logs a left join public.users u on u.id=a.user_id
       ${where} order by a.created_at desc limit $${params.length}`, params);
    res.json({ data: rows });
  }),
);
