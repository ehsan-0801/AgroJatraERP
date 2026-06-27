-- ============================================================================
--  AgroJatra ERP — Database Schema (multi-tenant SaaS)
--  Every business row belongs to an organization. Users join organizations via
--  memberships (with a role). A platform "super admin" can view all orgs.
--  PostgreSQL (Supabase). Idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- One-time migration from the single-organization model: if data tables aren't
-- org-scoped yet (or the old `company` table exists), drop them so they're
-- recreated with organization_id below.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='company')
     or not exists (select 1 from information_schema.tables where table_schema='public' and table_name='organizations')
     or not exists (
        select 1 from information_schema.columns
        where table_schema='public' and table_name='products' and column_name='organization_id') then
    drop table if exists
      public.sales_items, public.sales, public.purchase_items, public.purchases,
      public.products, public.categories, public.customers, public.suppliers,
      public.activity_logs, public.company cascade;
  end if;
end $$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ─── users (profile mirror of auth.users; platform super-admin flag) ────────
create table if not exists public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text,
  phone          text,
  avatar_url     text,
  theme          text not null default 'system',
  is_super_admin boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.users add column if not exists is_super_admin boolean not null default false;
alter table public.users add column if not exists phone text;
-- role/status moved to memberships in the multi-tenant model
alter table public.users drop column if exists role;
alter table public.users drop column if exists status;

-- ─── organizations (the tenant) ─────────────────────────────────────────────
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  logo_url   text,
  phone      text,
  email      text,
  address    text,
  currency   text not null default 'BDT',
  timezone   text not null default 'Asia/Dhaka',
  language   text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orgs_owner on public.organizations(owner_id);

-- ─── memberships (user ↔ organization, with role; max 5 enforced in API) ────
create table if not exists public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'viewer'
                  check (role in ('admin','inventory_manager','sales_manager','accountant','viewer')),
  status          text not null default 'active' check (status in ('active','inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists idx_memberships_user on public.memberships(user_id);
create index if not exists idx_memberships_org  on public.memberships(organization_id);

-- ─── categories ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  image_url       text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
alter table public.categories add column if not exists image_url text;
create unique index if not exists uq_categories_org_name on public.categories(organization_id, lower(name)) where deleted_at is null;
create index if not exists idx_categories_org on public.categories(organization_id) where deleted_at is null;

-- ─── products ───────────────────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  name            text not null,
  sku             text not null,
  barcode         text,
  unit            text not null default 'pcs',
  purchase_price  numeric(14,2) not null default 0 check (purchase_price >= 0),
  selling_price   numeric(14,2) not null default 0 check (selling_price >= 0),
  stock           numeric(14,2) not null default 0 check (stock >= 0),
  min_stock       numeric(14,2) not null default 0 check (min_stock >= 0),
  image_url       text,
  status          text not null default 'active' check (status in ('active','inactive')),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint chk_selling_gte_purchase check (selling_price >= purchase_price)
);
create unique index if not exists uq_products_org_sku     on public.products(organization_id, lower(sku)) where deleted_at is null;
create unique index if not exists uq_products_org_barcode on public.products(organization_id, barcode) where deleted_at is null and barcode is not null;
create index if not exists idx_products_org on public.products(organization_id) where deleted_at is null;
create index if not exists idx_products_category on public.products(category_id);

-- ─── customers ──────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
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
create index if not exists idx_customers_org on public.customers(organization_id) where deleted_at is null;

-- ─── suppliers ──────────────────────────────────────────────────────────────
create table if not exists public.suppliers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  address         text,
  notes           text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists idx_suppliers_org on public.suppliers(organization_id) where deleted_at is null;

-- ─── purchases ──────────────────────────────────────────────────────────────
create table if not exists public.purchases (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id     uuid references public.suppliers(id) on delete set null,
  created_by      uuid references auth.users(id) on delete set null,
  reference       text not null,
  purchase_date   date not null default current_date,
  subtotal        numeric(14,2) not null default 0,
  tax             numeric(14,2) not null default 0,
  discount        numeric(14,2) not null default 0,
  total           numeric(14,2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists idx_purchases_org on public.purchases(organization_id) where deleted_at is null;
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
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid references public.customers(id) on delete set null,
  created_by      uuid references auth.users(id) on delete set null,
  invoice_no      text not null,
  sale_date       date not null default current_date,
  subtotal        numeric(14,2) not null default 0,
  tax             numeric(14,2) not null default 0,
  discount        numeric(14,2) not null default 0,
  total           numeric(14,2) not null default 0,
  paid            numeric(14,2) not null default 0,
  payment_method  text not null default 'cash',
  status          text not null default 'completed',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists idx_sales_org on public.sales(organization_id) where deleted_at is null;
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

-- ─── activity_logs (per organization) ───────────────────────────────────────
create table if not exists public.activity_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  action          text not null,
  entity          text not null,
  entity_id       uuid,
  description     text,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_activity_org on public.activity_logs(organization_id, created_at desc);

-- ─── updated_at triggers ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['users','organizations','memberships','categories','products','customers','suppliers','purchases','sales']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s
                    for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ─── Row Level Security (defense in depth; API enforces by org + role) ───────
create or replace function public.is_org_member(org uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.memberships m
                 where m.organization_id = org and m.user_id = auth.uid() and m.status = 'active');
$$;

do $$
declare t text;
begin
  foreach t in array array['organizations','memberships','categories','products','customers','suppliers',
                           'purchases','sales','purchase_items','sales_items','activity_logs','users']
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

drop policy if exists p_users_self on public.users;
create policy p_users_self on public.users using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists p_orgs_member on public.organizations;
create policy p_orgs_member on public.organizations
  using (public.is_org_member(id) or owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists p_memberships on public.memberships;
create policy p_memberships on public.memberships using (public.is_org_member(organization_id));

do $$
declare t text;
begin
  foreach t in array array['categories','products','customers','suppliers','purchases','sales','activity_logs']
  loop
    execute format('drop policy if exists p_%1$s_org on public.%1$s;', t);
    execute format($p$create policy p_%1$s_org on public.%1$s
                     using (public.is_org_member(organization_id))
                     with check (public.is_org_member(organization_id));$p$, t);
  end loop;
end $$;

drop policy if exists p_purchase_items on public.purchase_items;
create policy p_purchase_items on public.purchase_items
  using (exists (select 1 from public.purchases p where p.id = purchase_id and public.is_org_member(p.organization_id)));
drop policy if exists p_sales_items on public.sales_items;
create policy p_sales_items on public.sales_items
  using (exists (select 1 from public.sales s where s.id = sale_id and public.is_org_member(s.organization_id)));
