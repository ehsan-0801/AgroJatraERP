# AgroJatra ERP — Frontend

Modern SaaS dashboard for AgroJatra ERP. Built with **React 19 + Vite +
TypeScript**, styled with **Tailwind CSS** and shadcn-style UI primitives.

## Stack
- React 19 + Vite + TypeScript
- Tailwind CSS + shadcn/ui-style components (Radix primitives)
- React Router 6, TanStack Query (server state), Zustand (UI/auth/theme state)
- React Hook Form + Zod, TanStack Table, Recharts, Sonner, lucide-react
- Supabase JS client for auth/session

## Setup

```bash
cd frontend
cp .env.example .env     # already pre-filled with the project's Supabase creds
npm install
npm run dev              # http://localhost:5173
```

> Make sure the **backend** is running on `http://localhost:4000` first.
> Override with `VITE_API_URL` in `.env` if needed.

## Scripts
| Script           | Description                  |
|------------------|------------------------------|
| `npm run dev`    | Start the Vite dev server    |
| `npm run build`  | Type-check + production build |
| `npm run preview`| Preview the production build |

## Features
- **Auth** — register, login, forgot-password, protected routes, session persistence
- **Dashboard** — 8 KPIs, sales/purchase trend charts, top products, recent activity
- **Products / Customers / Suppliers** — full CRUD with search & pagination
- **Purchases / Sales** — multi-line transaction entry with automatic stock updates
- **Reports** — per-entity reports with CSV export
- **Settings** — business info, currency, timezone, light/dark/system theme

## Structure
```
src/
  components/      ui primitives + ResourceManager / TransactionManager
  components/layout/  AppLayout, ProtectedRoute
  hooks/           useResource (generic CRUD)
  lib/             api client, supabase client, utils
  pages/           one file per route (+ pages/auth)
  store/           zustand stores (auth, theme)
```
