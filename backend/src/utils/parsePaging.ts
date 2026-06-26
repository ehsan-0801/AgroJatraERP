import type { Request } from 'express';

export interface Paging {
  page: number;
  limit: number;
  offset: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
}

/** Reads page/limit/search/sort/order query params with sane defaults. */
export function parsePaging(req: Request, allowedSort: string[], defaultSort = 'created_at'): Paging {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const sortReq = String(req.query.sort ?? defaultSort);
  const sort = allowedSort.includes(sortReq) ? sortReq : defaultSort;
  const order = String(req.query.order).toLowerCase() === 'asc' ? 'asc' : 'desc';
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search: String(req.query.search ?? '').trim(),
    sort,
    order,
  };
}
