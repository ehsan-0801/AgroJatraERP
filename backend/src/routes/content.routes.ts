import { Router } from 'express';
import { query } from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Public, unauthenticated: the marketing site fetches these overrides and
// merges them over the built-in translations.
export const contentRouter = Router();

contentRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query<{ data: unknown }>('select data from public.site_content where id = 1');
    res.json({ data: rows[0]?.data ?? {} });
  }),
);
