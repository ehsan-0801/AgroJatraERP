import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext, requireOrg, requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reviewsRouter = Router();

/** GET /reviews — public: published reviews for the homepage testimonials. */
reviewsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `select r.rating, r.comment, r.created_at,
              o.name as organization_name, o.address as organization_address,
              u.full_name as author_name
       from public.reviews r
       join public.organizations o on o.id = r.organization_id
       left join public.users u on u.id = r.user_id
       where r.published = true
       order by r.created_at desc
       limit 24`,
    );
    res.json({ data: rows });
  }),
);

/** GET /reviews/me — the active organization's own review (to prefill the form). */
reviewsRouter.get(
  '/me',
  requireAuth, loadContext, requireOrg,
  asyncHandler(async (req, res) => {
    const { rows } = await query('select rating, comment from public.reviews where organization_id = $1', [req.ctx!.orgId]);
    res.json({ data: rows[0] ?? null });
  }),
);

/** PUT /reviews — admin: create or update this organization's review. */
reviewsRouter.put(
  '/',
  requireAuth, loadContext, requireOrg, requirePermission('settings', 'update'),
  asyncHandler(async (req, res) => {
    const body = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().min(1).max(1000) }).parse(req.body);
    const { rows } = await query(
      `insert into public.reviews (organization_id, user_id, rating, comment) values ($1,$2,$3,$4)
       on conflict (organization_id) do update set rating = excluded.rating, comment = excluded.comment, user_id = excluded.user_id, updated_at = now()
       returning rating, comment`,
      [req.ctx!.orgId, req.user!.id, body.rating, body.comment],
    );
    res.json({ data: rows[0] });
  }),
);
