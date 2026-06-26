# AgroJatra ERP — Backend API

REST API for AgroJatra ERP. Built with **Express + TypeScript**, backed by
**Supabase PostgreSQL** (direct `pg` connection) and **Supabase Auth** for
authentication.

## Stack
- Express 4 + TypeScript (ESM)
- `pg` (node-postgres) against Supabase Postgres
- `@supabase/supabase-js` for auth (register / login / token verification)
- Zod validation, Helmet, CORS, Morgan

## Setup

```bash
cd backend
cp .env.example .env     # already pre-filled with the project's Supabase creds
npm install
npm run migrate          # applies src/db/schema.sql to the database
npm run dev              # http://localhost:4000
```

## Scripts
| Script            | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start with hot reload (tsx watch)        |
| `npm run build`   | Compile TypeScript to `dist/`            |
| `npm start`       | Run the compiled server                  |
| `npm run migrate` | Apply the SQL schema to Supabase         |
| `npm run typecheck` | Type-check without emitting            |

## API Overview
Base URL: `http://localhost:4000/api`

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | Create user + profile, returns session |
| POST | `/auth/login` | Email/password sign-in |
| POST | `/auth/forgot-password` | Send reset email |
| GET  | `/auth/me` | Current profile *(auth)* |
| GET  | `/dashboard` | KPIs + trends + recent activity *(auth)* |
| `GET/POST` | `/products` `/customers` `/suppliers` `/categories` | List (page/limit/search/sort) + create *(auth)* |
| `GET/PATCH/DELETE` | `/{resource}/:id` | Read / update / soft-delete *(auth)* |
| `GET/POST/DELETE` | `/purchases` | Create increases stock; delete reverses it *(auth)* |
| `GET/POST/DELETE` | `/sales` | Validates & deducts stock; delete restores it *(auth)* |
| GET | `/reports/{products\|customers\|suppliers\|purchases\|sales}` | Report data *(auth)* |
| `GET/PATCH` | `/settings` | Business info & preferences *(auth)* |

All authenticated routes require `Authorization: Bearer <supabase access token>`.

## Business rules enforced
- Unique SKU / barcode per owner
- `selling_price >= purchase_price`
- Stock can never go below zero; sales validate available stock
- Purchases increase stock, sales decrease it (atomic transactions)
- Soft deletes (`deleted_at`) across all resources
- Per-owner data isolation (every query is scoped to `owner_id`) plus
  Row Level Security policies for any direct Supabase access

## Notes on connections
The server connects to Supabase using `DATABASE_URL` (the **direct**, port-5432
connection). The pooled `DATABASE_POOL_URL` (pgbouncer, port 6543) is provided
for serverless deployments.
