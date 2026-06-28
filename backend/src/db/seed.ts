/**
 * Seeds two organizations (each fully isolated), their members, realistic data,
 * and one platform super admin.
 *
 *   npm run seed
 *
 * Password for every account: password123
 *
 *  ── Organization 1: "AgroJatra Demo Store" ──
 *    admin@agrojatra.com        → Admin (owner)
 *    inventory@agrojatra.com    → Inventory Manager
 *    sales@agrojatra.com        → Sales Manager
 *    accountant@agrojatra.com   → Accountant
 *    viewer@agrojatra.com       → Viewer
 *
 *  ── Organization 2: "Bengal Mart" ──
 *    owner@bengalmart.com       → Admin (owner)
 *    inventory@bengalmart.com   → Inventory Manager
 *    sales@bengalmart.com       → Sales Manager
 *
 *  ── Platform ──
 *    super@agrojatra.com        → Super Admin (sees all organizations)
 */
import { supabaseAdmin } from '../config/supabase.js';
import { pool, query, withTransaction } from './pool.js';

const PASSWORD = 'password123';
const pick = <T>(a: T[], i: number) => a[i % a.length];

async function getOrCreateUser(email: string, fullName: string): Promise<string> {
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  let id = list?.users.find((u) => u.email === email)?.id;
  if (!id) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (error || !data.user) throw new Error(`create ${email}: ${error?.message}`);
    id = data.user.id;
  } else {
    await supabaseAdmin.auth.admin.updateUserById(id, { password: PASSWORD });
  }
  await query(
    `insert into public.users (id, email, full_name) values ($1,$2,$3)
     on conflict (id) do update set full_name=excluded.full_name`,
    [id, email, fullName]);
  return id;
}

async function createOrg(name: string, ownerId: string, phone: string, email: string, address: string): Promise<string> {
  const id = (await query(
    `insert into public.organizations (name, owner_id, phone, email, address) values ($1,$2,$3,$4,$5) returning id`,
    [name, ownerId, phone, email, address])).rows[0].id;
  return id;
}

async function addMember(orgId: string, userId: string, role: string) {
  await query(
    `insert into public.memberships (organization_id, user_id, role, status) values ($1,$2,$3,'active')
     on conflict (organization_id, user_id) do update set role=excluded.role, status='active'`,
    [orgId, userId, role]);
}

const CATEGORY_NAMES = ['Grains & Rice', 'Beverages', 'Snacks', 'Household', 'Dairy', 'Spices'];
const PRODUCT_SEED: [string, string, string, string, number, number, number, number][] = [
  ['Premium Rice 5kg', 'RICE-5KG', 'Grains & Rice', 'bag', 380, 460, 120, 20],
  ['Basmati Rice 1kg', 'RICE-BAS-1', 'Grains & Rice', 'kg', 140, 175, 200, 30],
  ['Sugar 1kg', 'SUG-1KG', 'Grains & Rice', 'kg', 95, 118, 160, 25],
  ['Lentils (Masoor) 1kg', 'LEN-1KG', 'Grains & Rice', 'kg', 110, 135, 90, 15],
  ['Soybean Oil 5L', 'OIL-SOY-5L', 'Household', 'can', 820, 950, 60, 10],
  ['Tea 500g', 'TEA-500', 'Beverages', 'pack', 240, 300, 80, 12],
  ['Instant Coffee 100g', 'COF-100', 'Beverages', 'jar', 360, 440, 45, 8],
  ['Biscuits Family Pack', 'BIS-FAM', 'Snacks', 'pack', 55, 75, 220, 40],
  ['Potato Chips 100g', 'CHP-100', 'Snacks', 'pack', 30, 45, 300, 50],
  ['Powder Milk 1kg', 'MILK-PWD-1', 'Dairy', 'pack', 640, 760, 38, 10],
  ['Turmeric Powder 200g', 'SPC-TUR-200', 'Spices', 'pack', 70, 95, 110, 18],
  ['Chili Powder 200g', 'SPC-CHI-200', 'Spices', 'pack', 85, 115, 95, 18],
  ['Detergent 1kg', 'DET-1KG', 'Household', 'pack', 130, 165, 70, 12],
  ['Soap Bar (4pcs)', 'SOAP-4', 'Household', 'pack', 90, 120, 140, 20],
];

/** Seeds categories, products, customers, suppliers, purchases & sales for one org. */
async function seedBusiness(orgId: string, invId: string, salesId: string, poPrefix: string, invPrefix: string, scale: number) {
  const categories: Record<string, string> = {};
  for (const name of CATEGORY_NAMES) {
    categories[name] = (await query('insert into public.categories (organization_id, name, created_by) values ($1,$2,$3) returning id', [orgId, name, invId])).rows[0].id;
  }
  const products: { id: string; purchase: number; selling: number }[] = [];
  for (const [name, sku, cat, unit, purchase, selling, stock, min] of PRODUCT_SEED) {
    const id = (await query(
      `insert into public.products (organization_id, category_id, name, sku, unit, purchase_price, selling_price, stock, min_stock, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
      [orgId, categories[cat], name, sku, unit, purchase, selling, stock, min, invId])).rows[0].id;
    products.push({ id, purchase, selling });
  }

  const customerSeed: [string, string | null, string | null, string | null][] = [
    ['Rahim Traders', 'rahim@example.com', '01711000001', 'Mirpur, Dhaka'],
    ['Nadia Mart', 'nadia@example.com', '01711000002', 'Agrabad, Chattogram'],
    ['Karim General Store', 'karim@example.com', '01711000003', 'Zindabazar, Sylhet'],
    ['Green Agro Supply', 'green@example.com', '01711000004', 'Sonadanga, Khulna'],
    ['City Bazar', 'city@example.com', '01711000005', 'Uttara, Dhaka'],
    ['Walk-in Customer', null, null, null],
  ];
  const customers: string[] = [];
  for (const [name, email, phone, address] of customerSeed) {
    customers.push((await query('insert into public.customers (organization_id,name,email,phone,address,created_by) values ($1,$2,$3,$4,$5,$6) returning id', [orgId, name, email, phone, address, salesId])).rows[0].id);
  }

  const supplierSeed: [string, string, string, string][] = [
    ['Dhaka Wholesale Ltd', 'sales@dhakaws.com', '01811000001', 'Kawran Bazar, Dhaka'],
    ['National Distributors', 'info@natdist.com', '01811000002', 'Tongi, Gazipur'],
    ['Padma Foods', 'order@padmafoods.com', '01811000003', 'Rajshahi'],
    ['Bengal Trading Co', 'hello@bengaltrade.com', '01811000004', 'Narayanganj'],
  ];
  const suppliers: string[] = [];
  for (const [name, email, phone, address] of supplierSeed) {
    suppliers.push((await query('insert into public.suppliers (organization_id,name,email,phone,address,created_by) values ($1,$2,$3,$4,$5,$6) returning id', [orgId, name, email, phone, address, invId])).rows[0].id);
  }

  const numPurchases = Math.round(8 * scale);
  for (let i = 0; i < numPurchases; i++) {
    const lines = [pick(products, i * 2), pick(products, i * 2 + 1), pick(products, i * 3 + 2)].map((p, j) => ({ product_id: p.id, quantity: 10 + ((i + j) % 5) * 5, unit_price: p.purchase }));
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const tax = Math.round(subtotal * 0.05);
    await withTransaction(async (c) => {
      const pu = (await c.query(
        `insert into public.purchases (organization_id, supplier_id, created_by, reference, purchase_date, subtotal, tax, discount, total)
         values ($1,$2,$3,$4, current_date - ($5 || ' days')::interval, $6,$7,0,$8) returning id`,
        [orgId, pick(suppliers, i), invId, `${poPrefix}-100${i + 1}`, String(28 - i * 3), subtotal, tax, subtotal + tax])).rows[0];
      for (const l of lines) {
        await c.query('insert into public.purchase_items (purchase_id,product_id,quantity,unit_price,line_total) values ($1,$2,$3,$4,$5)', [pu.id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]);
        await c.query('update public.products set stock = stock + $1 where id=$2', [l.quantity, l.product_id]);
      }
    });
  }

  const numSales = Math.round(16 * scale);
  for (let i = 0; i < numSales; i++) {
    const lines = [pick(products, i + 1), pick(products, i * 2 + 3)].map((p, j) => ({ product_id: p.id, quantity: 2 + ((i + j) % 4), unit_price: p.selling }));
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const discount = i % 4 === 0 ? Math.round(subtotal * 0.05) : 0;
    const total = subtotal - discount;
    const paid = i % 5 === 0 ? Math.round(total * 0.6) : total;
    const customerId = pick(customers, i);
    await withTransaction(async (c) => {
      const sale = (await c.query(
        `insert into public.sales (organization_id, customer_id, created_by, invoice_no, sale_date, subtotal, tax, discount, total, paid, payment_method, status)
         values ($1,$2,$3,$4, current_date - ($5 || ' days')::interval, $6,0,$7,$8,$9,'cash','completed') returning id`,
        [orgId, customerId, salesId, `${invPrefix}-200${i + 1}`, String(Math.max(0, 29 - i * 2)), subtotal, discount, total, paid])).rows[0];
      for (const l of lines) {
        await c.query('insert into public.sales_items (sale_id,product_id,quantity,unit_price,line_total) values ($1,$2,$3,$4,$5)', [sale.id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]);
        await c.query('update public.products set stock = greatest(0, stock - $1) where id=$2', [l.quantity, l.product_id]);
      }
      if (total - paid > 0) await c.query('update public.customers set outstanding_due = outstanding_due + $1 where id=$2', [total - paid, customerId]);
    });
  }
  console.log(`  · org ${orgId.slice(0, 8)}…: ${CATEGORY_NAMES.length} categories, ${PRODUCT_SEED.length} products, ${customerSeed.length} customers, ${supplierSeed.length} suppliers, ${numPurchases} purchases, ${numSales} sales`);
}

async function main() {
  console.log('▶ Seeding organizations, members & data…');

  // Fresh start — TRUNCATE CASCADE clears organizations and every table that
  // references them (memberships + all business data), regardless of FK actions.
  await query('truncate table public.organizations cascade');
  console.log('  · cleared all organizations & data');

  // ── Super admin (platform, no organization) ──
  const superId = await getOrCreateUser('super@agrojatra.com', 'Platform Super Admin');
  await query('update public.users set is_super_admin = true where id=$1', [superId]);
  console.log('  · super admin: super@agrojatra.com');

  // ── Organization 1: AgroJatra Demo Store ──
  const adminId = await getOrCreateUser('admin@agrojatra.com', 'Demo Admin');
  const invId = await getOrCreateUser('inventory@agrojatra.com', 'Inventory Manager');
  const salesId = await getOrCreateUser('sales@agrojatra.com', 'Sales Manager');
  const accId = await getOrCreateUser('accountant@agrojatra.com', 'Accountant');
  const viewerId = await getOrCreateUser('viewer@agrojatra.com', 'Viewer');
  const org1 = await createOrg('AgroJatra Demo Store', adminId, '+880 1700-000000', 'hello@agrojatra.com', 'Dhaka, Bangladesh');
  await addMember(org1, adminId, 'admin');
  await addMember(org1, invId, 'inventory_manager');
  await addMember(org1, salesId, 'sales_manager');
  await addMember(org1, accId, 'accountant');
  await addMember(org1, viewerId, 'viewer');
  console.log('  · Organization 1 "AgroJatra Demo Store" with 5 members');
  await seedBusiness(org1, invId, salesId, 'PO', 'INV', 1);

  // ── Organization 2: Bengal Mart ──
  const owner2 = await getOrCreateUser('owner@bengalmart.com', 'Bengal Mart Owner');
  const inv2 = await getOrCreateUser('inventory@bengalmart.com', 'BM Inventory');
  const sales2 = await getOrCreateUser('sales@bengalmart.com', 'BM Sales');
  const org2 = await createOrg('Bengal Mart', owner2, '+880 1800-000000', 'hello@bengalmart.com', 'Chattogram, Bangladesh');
  await addMember(org2, owner2, 'admin');
  await addMember(org2, inv2, 'inventory_manager');
  await addMember(org2, sales2, 'sales_manager');
  console.log('  · Organization 2 "Bengal Mart" with 3 members');
  await seedBusiness(org2, inv2, sales2, 'BM-PO', 'BM-INV', 0.6);

  // ── Reviews (each org admin's testimonial, shown on the homepage) ──
  const reviews: [string, string, number, string][] = [
    [org1, adminId, 5, 'AgroJatra made our daily operations effortless — stock stays accurate and the team got productive within a day.'],
    [org2, owner2, 5, 'Setting up our organization took minutes and inviting the team was simple. The bilingual dashboard is a huge plus.'],
  ];
  for (const [orgId, uid, rating, comment] of reviews) {
    await query(
      `insert into public.reviews (organization_id, user_id, rating, comment) values ($1,$2,$3,$4)
       on conflict (organization_id) do update set rating = excluded.rating, comment = excluded.comment`,
      [orgId, uid, rating, comment]);
  }
  console.log('  · 2 reviews');

  // Prune any leftover accounts that aren't a super admin and belong to no
  // organization (abandoned signups / old dev users) so resets stay clean.
  const orphans = (await query<{ id: string; email: string }>(
    `select u.id, u.email from public.users u
     where u.is_super_admin = false
       and not exists (select 1 from public.memberships m where m.user_id = u.id)`)).rows;
  for (const o of orphans) {
    await supabaseAdmin.auth.admin.deleteUser(o.id).catch(() => {});
    await query('delete from public.users where id=$1', [o.id]).catch(() => {});
  }
  if (orphans.length) console.log(`  · pruned ${orphans.length} orphan account(s)`);

  console.log('\n✅ Seed complete. Log in (password: password123):');
  console.log('   Org 1: admin@agrojatra.com · inventory@agrojatra.com · sales@agrojatra.com · accountant@agrojatra.com · viewer@agrojatra.com');
  console.log('   Org 2: owner@bengalmart.com · inventory@bengalmart.com · sales@bengalmart.com');
  console.log('   Super admin: super@agrojatra.com');
  await pool.end();
}

main().catch(async (err) => { console.error('❌ Seed failed:', err.message); await pool.end(); process.exit(1); });
