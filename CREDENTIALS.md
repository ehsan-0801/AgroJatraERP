# AgroJatra ERP — Demo Credentials

Seeded by `cd backend && npm run seed`. **All demo accounts share the same password.**

> ⚠️ Demo data only — do not use these in production. Re-running `npm run seed`
> resets every account's password back to the value below.

**Password (all accounts):** `password123`

| Email | Role | What they can do |
|-------|------|------------------|
| `admin@agrojatra.com` | **Admin** | Everything — all modules (CRUD), Users, Roles, Company Settings, all reports + export |
| `inventory@agrojatra.com` | **Inventory Manager** | Products & Categories (add/edit, no delete), Suppliers & Purchases (CRUD); inventory reports |
| `sales@agrojatra.com` | **Sales Manager** | Customers & Sales (CRUD), create invoices; sales & customer reports |
| `accountant@agrojatra.com` | **Accountant** | View purchases & sales; financial reports + CSV export; **Accounts** module (revenue, COGS, gross profit, receivables + transaction ledger) |
| `viewer@agrojatra.com` | **Viewer** | Read-only across the app; can view all reports (no export) |

## Notes
- The **first user to register** (via `/register`) automatically becomes **Admin**; every later self-registration is created as **Viewer** for an Admin to promote.
- Promote anyone to Admin from the CLI: `cd backend && npm run make-admin -- someone@example.com`
- Admins manage everyone else from **Users** (`/users`) — create accounts, assign roles, activate/deactivate.
- Each user can change their own name and password under **Settings → Profile / Security** (or `/profile`).

## Quick start
```bash
# 1) Backend
cd backend && npm install && npm run migrate && npm run seed && npm run dev   # http://localhost:4000

# 2) Frontend (new terminal)
cd frontend && npm install && npm run dev                                     # http://localhost:5173

# 3) Open http://localhost:5173/login and sign in with any account above.
```
