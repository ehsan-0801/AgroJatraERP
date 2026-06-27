import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const organizationsRouter = Router();
organizationsRouter.use(requireAuth, loadContext);

const onboardSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

/** POST /organizations — onboard: create the org and make the creator its Admin. */
organizationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = onboardSchema.parse(req.body);
    const userId = req.user!.id;

    const org = await withTransaction(async (c) => {
      const o = (await c.query(
        `insert into public.organizations (name, owner_id, phone, email, address, currency, timezone)
         values ($1,$2,$3,$4,$5,coalesce($6,'BDT'),coalesce($7,'Asia/Dhaka')) returning *`,
        [body.name, userId, body.phone ?? null, body.email ?? null, body.address ?? null, body.currency ?? null, body.timezone ?? null],
      )).rows[0];
      await c.query(
        `insert into public.memberships (organization_id, user_id, role, status) values ($1,$2,'admin','active')`,
        [o.id, userId],
      );
      return o;
    });
    await logActivity({ organizationId: org.id, userId, action: 'created', entity: 'organizations', entityId: org.id, description: `Created organization ${org.name}` });
    res.status(201).json({ data: org });
  }),
);

/** GET /organizations/current — the active organization's profile. */
organizationsRouter.get(
  '/current',
  asyncHandler(async (req, res) => {
    if (!req.ctx?.orgId) throw new ApiError(404, 'No active organization');
    const { rows } = await query('select * from public.organizations where id=$1', [req.ctx.orgId]);
    res.json({ data: rows[0] });
  }),
);
