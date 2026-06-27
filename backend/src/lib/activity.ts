import { query } from '../db/pool.js';

/** Records an entry in the per-organization activity/audit log. Never throws. */
export async function logActivity(opts: {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description?: string;
  metadata?: unknown;
}): Promise<void> {
  try {
    await query(
      `insert into public.activity_logs (organization_id, user_id, action, entity, entity_id, description, metadata)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [
        opts.organizationId ?? null,
        opts.userId ?? null,
        opts.action,
        opts.entity,
        opts.entityId ?? null,
        opts.description ?? null,
        opts.metadata ? JSON.stringify(opts.metadata) : null,
      ],
    );
  } catch (err) {
    console.error('activity log failed:', (err as Error).message);
  }
}
