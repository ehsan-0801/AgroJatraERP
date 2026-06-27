# AgroJatra ERP — Roles, Routes & API Access

This document describes the **5 system roles**, what each can do, and exactly
which **frontend routes** and **backend API endpoints** each role may access.

> Source of truth: `backend/src/lib/permissions.ts` (mirrored in
> `frontend/src/lib/permissions.ts`). The backend enforces every rule; the
> frontend only hides what you can't use.

---

## 1. Roles

| Role | Key | Purpose |
|------|-----|---------|
| **Admin** | `admin` | Full control of the system — all data, users and settings. The first registered user becomes Admin. |
| **Inventory Manager** | `inventory_manager` | Owns inventory: products (add/edit, no delete), categories, suppliers and purchasing. |
| **Sales Manager** | `sales_manager` | Owns the customer side: customers and sales/invoicing. |
| **Accountant** | `accountant` | Read-only on transactions; views & exports financial reports. |
| **Viewer** | `viewer` | Read-only across the app. Default role for new (invited) users. |

Actions are **C**reate · **R**ead · **U**pdate · **D**elete.
`CRUD` = all four · `Create/Edit` = create + read + update (no delete) · `View` = read-only · `—` = no access.

---

## 2. Permission Matrix

| Module | Admin | Inventory Manager | Sales Manager | Accountant | Viewer |
|--------|:-----:|:-----------------:|:-------------:|:----------:|:------:|
| Dashboard | View | View | View | View | View |
| Products | **CRUD** | Create/Edit | View | View | View |
| Categories | **CRUD** | Create/Edit | View | View | View |
| Customers | **CRUD** | View | **CRUD** | View | View |
| Suppliers | **CRUD** | **CRUD** | View | View | View |
| Purchases | **CRUD** | **CRUD** | View | View | View |
| Sales | **CRUD** | View | **CRUD** | View | View |
| Reports | All | Inventory | Sales | Financial | View all |
| Accounts (Finance) | View | — | — | View | — |
| Users | **CRUD** | — | — | — | — |
| Settings (Company) | **CRUD** | — | — | — | — |
| Profile & Security | Self | Self | Self | Self | Self |
| CSV Export | ✅ | — | — | ✅ | — |

**Reports access** (which report categories each role may open):

| Report | Admin | Inventory | Sales | Accountant | Viewer |
|--------|:-----:|:---------:|:-----:|:----------:|:------:|
| Products | ✅ | ✅ | — | — | ✅ |
| Customers | ✅ | — | ✅ | — | ✅ |
| Suppliers | ✅ | ✅ | — | — | ✅ |
| Purchases | ✅ | ✅ | — | ✅ | ✅ |
| Sales | ✅ | — | ✅ | ✅ | ✅ |

> Every role can open **Profile** and **Security** (change their own name /
> password). Only **Admin** can edit **Company Settings** and manage **Users/Roles**.

---

## 3. Frontend Routes

### Public (no login, always light theme)
| Route | Page |
|-------|------|
| `/` | Landing / marketing home |
| `/features` | Features |
| `/pricing` | Pricing |
| `/about` | About |
| `/contact` | Contact |

### Authentication
| Route | Page |
|-------|------|
| `/login` | Sign in |
| `/register` | Create account (first user → Admin) |
| `/forgot-password` | Request reset link |
| `/reset-password` | Set new password (from email link) |

### Application (login required) — ✅ = can open, 👁 = read-only view, — = hidden/redirected
| Route | Admin | Inventory | Sales | Accountant | Viewer |
|-------|:-----:|:---------:|:-----:|:----------:|:------:|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/products` (list) | ✅ | ✅ | 👁 | 👁 | 👁 |
| `/products/new` | ✅ | ✅ | — | — | — |
| `/products/:id` (detail) | ✅ | ✅ | 👁 | 👁 | 👁 |
| `/products/:id/edit` | ✅ | ✅ | — | — | — |
| `/categories` (+ `/new`, `/:id/edit`) | ✅ | ✅ (no delete) | 👁 | 👁 | 👁 |
| `/customers` (list/detail) | ✅ | 👁 | ✅ | 👁 | 👁 |
| `/customers/new`, `/:id/edit` | ✅ | — | ✅ | — | — |
| `/suppliers` (list/detail) | ✅ | ✅ | 👁 | 👁 | 👁 |
| `/suppliers/new`, `/:id/edit` | ✅ | ✅ | — | — | — |
| `/purchases` (list/detail) | ✅ | ✅ | 👁 | 👁 | 👁 |
| `/purchases/new`, `/:id/edit` | ✅ | ✅ | — | — | — |
| `/sales` (list/detail) | ✅ | 👁 | ✅ | 👁 | 👁 |
| `/sales/new`, `/:id/edit` | ✅ | — | ✅ | — | — |
| `/reports` | ✅ | ✅* | ✅* | ✅* | ✅* |
| `/accounts` (finance summary + ledger) | ✅ | — | — | ✅ | — |
| `/users` (+ `/new`, `/:id/edit`) | ✅ | — | — | — | — |
| `/roles` | ✅ | — | — | — | — |
| `/settings` · `/settings/company` | ✅ | — | — | — | — |
| `/settings/profile` · `/settings/security` · `/profile` | ✅ | ✅ | ✅ | ✅ | ✅ |

\* Reports page only shows the report categories that role is allowed to open (see matrix above). Deleting a record is Admin-only for every module; `delete` actions never appear for other roles.

Routes a role can't access are guarded by `RequirePermission` and redirect to `/dashboard`. Sidebar items are hidden when the role lacks read access to that module.

---

## 4. Backend API

Base URL: `http://localhost:4000/api`
All non-auth endpoints require a Supabase `Authorization: Bearer <token>` header.
Action → method: **create = POST · read = GET · update = PATCH · delete = DELETE**.

### Auth — `/auth`
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/auth/register` | Public (first user → Admin, others → Viewer) |
| POST | `/auth/login` | Public |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Any logged-in (recovery) session |
| POST | `/auth/logout` | Any logged-in user |
| GET | `/auth/me` | Any logged-in user (returns profile + role) |

### Dashboard — `/dashboard`
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/dashboard` | All roles |

### Products / Categories — `/products`, `/categories`
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/products`, `/products/:id` | All roles |
| POST | `/products` | Admin, Inventory Manager |
| PATCH | `/products/:id` | Admin, Inventory Manager |
| DELETE | `/products/:id` | **Admin only** |

*(`/categories` follows the exact same rules as `/products`.)*

### Suppliers — `/suppliers`  ·  Purchases — `/purchases`
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/suppliers`, `/purchases` (+ `/:id`) | All roles |
| POST | `/suppliers`, `/purchases` | Admin, Inventory Manager |
| PATCH | `/suppliers/:id`, `/purchases/:id` | Admin, Inventory Manager |
| DELETE | `/suppliers/:id`, `/purchases/:id` | **Admin only** |

### Customers — `/customers`  ·  Sales — `/sales`
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/customers`, `/sales` (+ `/:id`) | All roles |
| POST | `/customers`, `/sales` | Admin, Sales Manager |
| PATCH | `/customers/:id`, `/sales/:id` | Admin, Sales Manager |
| DELETE | `/customers/:id`, `/sales/:id` | **Admin only** |

### Reports — `/reports`
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/reports/products` | Admin, Inventory, Viewer |
| GET | `/reports/customers` | Admin, Sales, Viewer |
| GET | `/reports/suppliers` | Admin, Inventory, Viewer |
| GET | `/reports/purchases` | Admin, Inventory, Accountant, Viewer |
| GET | `/reports/sales` | Admin, Sales, Accountant, Viewer |

### Accounts (Finance) — `/accounts`  *(Admin & Accountant)*
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/accounts/summary?from=&to=` | Admin, Accountant — revenue, COGS, gross profit, purchases, tax, discounts, payments, receivables + 12-month trend |
| GET | `/accounts/ledger?from=&to=&type=` | Admin, Accountant — combined sales (money in) + purchases (money out) |

### Users — `/users`  *(Admin only)*
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/users`, `/users/:id`, `/users/roles` | **Admin only** |
| POST | `/users` | **Admin only** |
| PATCH | `/users/:id` | **Admin only** |
| DELETE | `/users/:id` | **Admin only** (can't delete self or the last Admin) |

### Settings — `/settings`
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/settings/company` | **Admin only** |
| PATCH | `/settings/company` | **Admin only** |
| PATCH | `/settings/profile` | Any logged-in user (own profile) |
| PATCH | `/settings/security` | Any logged-in user (own password) |

### Activity & Insights
| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/activity?entity=&entity_id=` | Any role (record timeline) |
| GET | `/activity` (global audit log) | **Admin only** |
| GET | `/insights/product/:id` | All roles (products read) |
| GET | `/insights/customer/:id` | All roles (customers read) |
| GET | `/insights/supplier/:id` | All roles (suppliers read) |

---

## 5. Enforcement notes

- **Server-side first:** every write is gated by `requirePermission(module, action)` middleware in the API; the role comes from `public.users.role`, loaded on each request. A blocked call returns **403**.
- **UI mirrors, never trusts:** the frontend hides buttons/routes a role can't use, but the API is the real gate.
- **Stock & dues:** sales validate stock and adjust customer dues transactionally; deleting/editing reverses the effects (Admin only for delete).
- **Audit:** create/update/delete and logins are written to `activity_logs` and surfaced on detail pages' Activity tab (Admin sees the global log).
