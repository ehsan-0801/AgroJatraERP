# AgroJatra ERP

> *Everything Your Business Needs in One Place.*

A modern, web-based ERP for small and medium businesses in Bangladesh —
inventory, purchasing, sales, customers, suppliers, reporting and analytics in
one platform.

This repository is split into two independently runnable apps:

```
AgroJatraErp/
├── backend/    Express + TypeScript REST API  (Supabase Postgres + Auth)
├── frontend/   React 19 + Vite dashboard      (Tailwind + shadcn-style UI)
└── *.md        Product/requirements specs
```

## Quick start

Open two terminals.

**1 — Backend**
```bash
cd backend
npm install
npm run migrate      # creates all tables on Supabase (run once)
npm run dev          # → http://localhost:4000
```

**2 — Frontend**
```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

Then open http://localhost:5173, create an account, and you're in.

> Both `.env` files are pre-filled with the provided Supabase credentials.
> `.env.example` files document every variable. **Do not commit real secrets** —
> the `.env` files are git-ignored.

## Architecture

```
React (Vite) ──HTTP(Bearer JWT)──▶ Express API ──pg──▶ Supabase PostgreSQL
      │                                  ▲
      └────────── Supabase Auth ─────────┘   (login/session/JWT)
```

- **Auth**: Supabase Auth issues JWTs; the frontend stores the session and sends
  it as `Authorization: Bearer`; the backend verifies every request.
- **Data**: the API owns all business logic — stock movements, validation, and
  per-owner isolation run in PostgreSQL transactions.
- **Security**: protected routes, server-side validation (Zod), Row Level
  Security policies, and soft deletes.

See each subfolder's `README.md` for details, and `AgroJatra-ERP-Requirements.md`
for the full product specification.
