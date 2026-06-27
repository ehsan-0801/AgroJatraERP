-- ============================================================================
--  AgroJatra ERP — Database Schema (single company, 6 system roles)
--  PostgreSQL (Supabase). Idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- One-time migration away from the previous multi-tenant model: if the old
-- tenant tables / business_id columns exist, drop the data tables so they are
-- recreated for the single-company model below.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'business_id'
  ) or exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='businesses'
  ) then
    drop table if exists
      public.sales_items, public.sales,
      public.purchase_items, public.purchases,
      public.products, public.categories,
      public.customers, public.suppliers,
      public.audit_logs, public.activity_logs,
      public.invitations, public.memberships, public.businesses cascade;
  end if;
end $$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ─── users (one company; each has a single system role) ─────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'viewer'
              check (role in ('admin','inventory_manager','sales_manager','accountant','viewer')),
  status      text not null default 'active' check (status in ('active','inactive')),
  theme       text not null default 'system',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- additive (upgrades a users table created under the previous schema)
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists role text;
alter table public.users add column if not exists status text;
update public.users set role = 'viewer' where role is null;
update public.users set status = 'active' where status is null;
-- merge the former Super Admin role into Admin (single top role)
update public.users set role = 'admin' where role = 'super_admin';
alter table public.users alter column role set default 'viewer';
alter table public.users alter column role set not null;
alter table public.users alter column status set default 'active';
alter table public.users alter column status set not null;
do $$
begin
  -- drop the legacy inline check (allowed super_admin) if present
  if exists (select 1 from pg_constraint where conname = 'users_role_check') then
    alter table public.users drop constraint users_role_check;
  end if;
  -- (re)create the role check without super_admin
  if exists (select 1 from pg_constraint where conname = 'users_role_chk') then
    alter table public.users drop constraint users_role_chk;
  end if;
  alter table public.users add constraint users_role_chk
    check (role in ('admin','inventory_manager','sales_manager','accountant','viewer'));
  if not exists (select 1 from pg_constraint where conname = 'users_status_chk') then
    alter table public.users add constraint users_status_chk check (status in ('active','inactive'));
  end if;
end $$;

-- ─── company (singleton settings row) ───────────────────────────────────────
create table if not exists public.company (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'AgroJatra ERP',
  logo_url    text,
  phone       text,
  email       text,
  address     text,
  currency    text not null default 'BDT',
  timezone    text not null default 'Asia/Dhaka',
  language    text not null default 'en',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── categories ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create unique index if not exists uq_categories_name on public.categories(lower(name)) where deleted_at is null;

-- ─── products ───────────────────────────────────────────────────────────────
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid references public.categories(id) on delete set null,
  name           text not null,
  sku            text not null,
  barcode        text,
  unit           text not null default 'pcs',
  purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
  selling_price  numeric(14,2) not null default 0 check (selling_price >= 0),
  stock          numeric(14,2) not null default 0 check (stock >= 0),
  min_stock      numeric(14,2) not null default 0 check (min_stock >= 0),
  image_url      text,
  status         text not null default 'active' check (status in ('active','inactive')),
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  constraint chk_selling_gte_purchase check (selling_price >= purchase_price)
);
create unique index if not exists uq_products_sku     on public.products(lower(sku)) where deleted_at is null;
create unique index if not exists uq_products_barcode on public.products(barcode) where deleted_at is null and barcode is not null;
create index if not exists idx_products_category on public.products(category_id);

-- ─── customers ──────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  address         text,
  notes           text,
  outstanding_due numeric(14,2) not null default 0,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ─── suppliers ──────────────────────────────────────────────────────────────
create table if not exists public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  address     text,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ─── purchases ──────────────────────────────────────────────────────────────
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid references public.suppliers(id) on delete set null,
  created_by    uuid references auth.users(id) on delete set null,
  reference     text not null,
  purchase_date date not null default current_date,
  subtotal      numeric(14,2) not null default 0,
  tax           numeric(14,2) not null default 0,
  discount      numeric(14,2) not null default 0,
  total         numeric(14,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists idx_purchases_supplier on public.purchases(supplier_id);

create table if not exists public.purchase_items (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  quantity    numeric(14,2) not null check (quantity > 0),
  unit_price  numeric(14,2) not null default 0,
  line_total  numeric(14,2) not null default 0
);
create index if not exists idx_purchase_items_purchase on public.purchase_items(purchase_id);
create index if not exists idx_purchase_items_product  on public.purchase_items(product_id);

-- ─── sales ──────────────────────────────────────────────────────────────────
create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references public.customers(id) on delete set null,
  created_by     uuid references auth.users(id) on delete set null,
  invoice_no     text not null,
  sale_date      date not null default current_date,
  subtotal       numeric(14,2) not null default 0,
  tax            numeric(14,2) not null default 0,
  discount       numeric(14,2) not null default 0,
  total          numeric(14,2) not null default 0,
  paid           numeric(14,2) not null default 0,
  payment_method text not null default 'cash',
  status         text not null default 'completed',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists idx_sales_customer on public.sales(customer_id);

create table if not exists public.sales_items (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity   numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0
);
create index if not exists idx_sales_items_sale    on public.sales_items(sale_id);
create index if not exists idx_sales_items_product on public.sales_items(product_id);

-- ─── activity_logs (audit trail / timeline) ─────────────────────────────────
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,            -- created | updated | deleted | login ...
  entity      text not null,            -- products | sales | users ...
  entity_id   uuid,
  description text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);
create index if not exists idx_activity_entity  on public.activity_logs(entity, entity_id);

-- ─── updated_at triggers ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['users','company','categories','products','customers','suppliers','purchases','sales']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s
                    for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ─── Row Level Security (defense in depth; API enforces by role) ─────────────
create or replace function public.is_active_user()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.status = 'active');
$$;

do $$
declare t text;
begin
  foreach t in array array['users','company','categories','products','customers','suppliers',
                           'purchases','purchase_items','sales','sales_items','activity_logs']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists p_%1$s_authed on public.%1$s;', t);
    execute format('create policy p_%1$s_authed on public.%1$s using (public.is_active_user()) with check (public.is_active_user());', t);
  end loop;
end $$;
