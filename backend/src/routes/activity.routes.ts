import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const activityRouter = Router();
activityRouter.use(requireAuth, loadContext, requireOrg);

// GET /activity?entity=&entity_id= — activity for this organization
// (optionally scoped to a single record). Always organization-scoped.
activityRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const entity = req.query.entity as string | undefined;
    const entityId = req.query.entity_id as string | undefined;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const params: unknown[] = [req.ctx!.orgId];
    const clauses: string[] = ['a.organization_id = $1'];
    if (entity) { params.push(entity); clauses.push(`a.entity = $${params.length}`); }
    if (entityId) { params.push(entityId); clauses.push(`a.entity_id = $${params.length}`); }
    params.push(limit);
    const { rows } = await query(
      `select a.*, u.full_name as user_name, u.email as user_email
       from public.activity_logs a left join public.users u on u.id=a.user_id
       where ${clauses.join(' and ')} order by a.created_at desc limit $${params.length}`, params);
    res.json({ data: rows });
  }),
);
