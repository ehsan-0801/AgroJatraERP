import { Router } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { query } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import type { Module } from '../lib/permissions.js';
import { requireAuth } from '../middleware/auth.js';
import { loadUser, requirePermission } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePaging } from '../utils/parsePaging.js';

interface CrudConfig {
  table: string;
  module: Module;
  columns: string[];
  searchable: string[];
  sortable: string[];
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  /** optional exact-match filters: ?param=value → WHERE column = value */
  filters?: { param: string; column: string }[];
  /** extra select expression appended to `*` (e.g. a joined name) */
  selectExtra?: string;
  joins?: string;
}

/** Builds a permission-gated, soft-delete CRUD router for the single company. */
export function crudRouter(cfg: CrudConfig): Router {
  const router = Router();
  router.use(requireAuth, loadUser);

  const T = `public.${cfg.table}`;
  const alias = 't';

  router.get(
    '/',
    requirePermission(cfg.module, 'read'),
    asyncHandler(async (req, res) => {
      const p = parsePaging(req, cfg.sortable);
      const params: unknown[] = [];
      const clauses = [`${alias}.deleted_at is null`];

      if (p.search && cfg.searchable.length) {
        params.push(`%${p.search}%`);
        const idx = params.length;
        clauses.push(`(${cfg.searchable.map((c) => `${alias}.${c} ilike $${idx}`).join(' or ')})`);
      }
      for (const f of cfg.filters ?? []) {
        const v = req.query[f.param];
        if (v !== undefined && v !== '') {
          params.push(v);
          clauses.push(`${alias}.${f.column} = $${params.length}`);
        }
      }
      const where = clauses.join(' and ');

      // Single round-trip: the window count returns the full match count
      // (computed before LIMIT), so we avoid a separate COUNT query.
      params.push(p.limit, p.offset);
      const { rows } = await query<Record<string, unknown>>(
        `select ${alias}.*${cfg.selectExtra ? ', ' + cfg.selectExtra : ''}, count(*) over()::int as __total
         from ${T} ${alias} ${cfg.joins ?? ''}
         where ${where} order by ${alias}.${p.sort} ${p.order}
         limit $${params.length - 1} offset $${params.length}`,
        params,
      );
      const total = rows.length ? Number(rows[0].__total) : 0;
      const data = rows.map(({ __total, ...rest }) => rest);
      res.json({ data, page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) });
    }),
  );

  router.get(
    '/:id',
    requirePermission(cfg.module, 'read'),
    asyncHandler(async (req, res) => {
      const { rows } = await query(
        `select ${alias}.*${cfg.selectExtra ? ', ' + cfg.selectExtra : ''}
         from ${T} ${alias} ${cfg.joins ?? ''}
         where ${alias}.id = $1 and ${alias}.deleted_at is null`,
        [req.params.id],
      );
      if (!rows[0]) throw new ApiError(404, 'Not found');
      res.json({ data: rows[0] });
    }),
  );

  router.post(
    '/',
    requirePermission(cfg.module, 'create'),
    asyncHandler(async (req, res) => {
      const body = cfg.createSchema.parse(req.body) as Record<string, unknown>;
      const cols = cfg.columns.filter((c) => body[c] !== undefined);
      const values = cols.map((c) => body[c]);
      const allCols = [...cols, 'created_by'];
      const placeholders = allCols.map((_, i) => `$${i + 1}`);
      const { rows } = await query(
        `insert into ${T} (${allCols.join(', ')}) values (${placeholders.join(', ')}) returning *`,
        [...values, req.user!.id],
      );
      await logActivity({ userId: req.user!.id, action: 'created', entity: cfg.table, entityId: rows[0].id, description: `Created ${cfg.module.slice(0, -1)}` });
      res.status(201).json({ data: rows[0] });
    }),
  );

  router.patch(
    '/:id',
    requirePermission(cfg.module, 'update'),
    asyncHandler(async (req, res) => {
      const body = cfg.updateSchema.parse(req.body) as Record<string, unknown>;
      const cols = cfg.columns.filter((c) => body[c] !== undefined);
      if (!cols.length) throw new ApiError(400, 'No updatable fields provided');
      const sets = cols.map((c, i) => `${c} = $${i + 2}`);
      const { rows } = await query(
        `update ${T} set ${sets.join(', ')} where id = $1 and deleted_at is null returning *`,
        [req.params.id, ...cols.map((c) => body[c])],
      );
      if (!rows[0]) throw new ApiError(404, 'Not found');
      await logActivity({ userId: req.user!.id, action: 'updated', entity: cfg.table, entityId: req.params.id, description: `Updated ${cfg.module.slice(0, -1)}` });
      res.json({ data: rows[0] });
    }),
  );

  router.delete(
    '/:id',
    requirePermission(cfg.module, 'delete'),
    asyncHandler(async (req, res) => {
      const { rows } = await query(
        `update ${T} set deleted_at = now() where id = $1 and deleted_at is null returning id`,
        [req.params.id],
      );
      if (!rows[0]) throw new ApiError(404, 'Not found');
      await logActivity({ userId: req.user!.id, action: 'deleted', entity: cfg.table, entityId: req.params.id, description: `Deleted ${cfg.module.slice(0, -1)}` });
      res.json({ message: 'Deleted', id: rows[0].id });
    }),
  );

  return router;
}

export { z };
