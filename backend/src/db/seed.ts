/**
 * Seeds the company, one user per role, and realistic data.
 *
 *   npm run seed
 *
 * Accounts (password: password123):
 *   super@agrojatra.com        → Super Admin
 *   admin@agrojatra.com        → Admin
 *   inventory@agrojatra.com    → Inventory Manager
 *   sales@agrojatra.com        → Sales Manager
 *   accountant@agrojatra.com   → Accountant
 *   viewer@agrojatra.com       → Viewer
 */
import { supabaseAdmin } from '../config/supabase.js';
import { pool, query, withTransaction } from './pool.js';

const PASSWORD = 'password123';
const pick = <T>(a: T[], i: number) => a[i % a.length];

async function getOrCreateUser(email: string, fullName: string, role: string): Promise<string> {
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  let id = list?.users.find((u) => u.email === email)?.id;
  if (!id) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (error || !data.user) throw new Error(`create ${email}: ${error?.message}`);
    id = data.user.id;
  } else {
    // reset the password so the seed credentials always work
    await supabaseAdmin.auth.admin.updateUserById(id, { password: PASSWORD });
  }
  await query(
    `insert into public.users (id, email, full_name, role, status) values ($1,$2,$3,$4,'active')
     on conflict (id) do update set full_name=excluded.full_name, role=excluded.role, status='active'`,
    [id, email, fullName, role]);
  return id;
}

async function main() {
  console.log('▶ Seeding company, users & data…');

  // Company singleton
  await query(`insert into public.company (name, phone, email, address)
               select 'AgroJatra Demo Store','+880 1700-000000','hello@agrojatra.com','Dhaka, Bangladesh'
               where not exists (select 1 from public.company)`);

  const superId = await getOrCreateUser('super@agrojatra.com', 'Super Admin', 'super_admin');
  const adminId = await getOrCreateUser('admin@agrojatra.com', 'Demo Admin', 'admin');
  const invId = await getOrCreateUser('inventory@agrojatra.com', 'Inventory Manager', 'inventory_manager');
  const salesId = await getOrCreateUser('sales@agrojatra.com', 'Sales Manager', 'sales_manager');
  await getOrCreateUser('accountant@agrojatra.com', 'Accountant', 'accountant');
  await getOrCreateUser('viewer@agrojatra.com', 'Viewer', 'viewer');
  console.log('  · company + 6 role users');

  // wipe data
  for (const t of ['sales', 'purchases', 'products', 'categories', 'customers', 'suppliers', 'activity_logs']) {
    await query(`delete from public.${t}`);
  }

  const categoryNames = ['Grains & Rice', 'Beverages', 'Snacks', 'Household', 'Dairy', 'Spices'];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    categories[name] = (await query('insert into public.categories (name, created_by) values ($1,$2) returning id', [name, invId])).rows[0].id;
  }

  const productSeed: [string, string, string, string, number, number, number, number][] = [
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
  const products: { id: string; purchase: number; selling: number }[] = [];
  for (const [name, sku, cat, unit, purchase, selling, stock, min] of productSeed) {
    const id = (await query(
      `insert into public.products (category_id, name, sku, unit, purchase_price, selling_price, stock, min_stock, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
      [categories[cat], name, sku, unit, purchase, selling, stock, min, invId])).rows[0].id;
    products.push({ id, purchase, selling });
  }
  console.log(`  · ${categoryNames.length} categories, ${productSeed.length} products`);

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
    customers.push((await query('insert into public.customers (name,email,phone,address,created_by) values ($1,$2,$3,$4,$5) returning id', [name, email, phone, address, salesId])).rows[0].id);
  }

  const supplierSeed: [string, string, string, string][] = [
    ['Dhaka Wholesale Ltd', 'sales@dhakaws.com', '01811000001', 'Kawran Bazar, Dhaka'],
    ['National Distributors', 'info@natdist.com', '01811000002', 'Tongi, Gazipur'],
    ['Padma Foods', 'order@padmafoods.com', '01811000003', 'Rajshahi'],
    ['Bengal Trading Co', 'hello@bengaltrade.com', '01811000004', 'Narayanganj'],
  ];
  const suppliers: string[] = [];
  for (const [name, email, phone, address] of supplierSeed) {
    suppliers.push((await query('insert into public.suppliers (name,email,phone,address,created_by) values ($1,$2,$3,$4,$5) returning id', [name, email, phone, address, invId])).rows[0].id);
  }
  console.log(`  · ${customerSeed.length} customers, ${supplierSeed.length} suppliers`);

  for (let i = 0; i < 8; i++) {
    const lines = [pick(products, i * 2), pick(products, i * 2 + 1), pick(products, i * 3 + 2)].map((p, j) => ({ product_id: p.id, quantity: 10 + ((i + j) % 5) * 5, unit_price: p.purchase }));
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const tax = Math.round(subtotal * 0.05);
    await withTransaction(async (c) => {
      const pu = (await c.query(
        `insert into public.purchases (supplier_id, created_by, reference, purchase_date, subtotal, tax, discount, total)
         values ($1,$2,$3, current_date - ($4 || ' days')::interval, $5,$6,0,$7) returning id`,
        [pick(suppliers, i), invId, `PO-100${i + 1}`, String(28 - i * 3), subtotal, tax, subtotal + tax])).rows[0];
      for (const l of lines) {
        await c.query('insert into public.purchase_items (purchase_id,product_id,quantity,unit_price,line_total) values ($1,$2,$3,$4,$5)', [pu.id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]);
        await c.query('update public.products set stock = stock + $1 where id=$2', [l.quantity, l.product_id]);
      }
    });
  }

  for (let i = 0; i < 16; i++) {
    const lines = [pick(products, i + 1), pick(products, i * 2 + 3)].map((p, j) => ({ product_id: p.id, quantity: 2 + ((i + j) % 4), unit_price: p.selling }));
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const discount = i % 4 === 0 ? Math.round(subtotal * 0.05) : 0;
    const total = subtotal - discount;
    const paid = i % 5 === 0 ? Math.round(total * 0.6) : total;
    const customerId = pick(customers, i);
    await withTransaction(async (c) => {
      const sale = (await c.query(
        `insert into public.sales (customer_id, created_by, invoice_no, sale_date, subtotal, tax, discount, total, paid, payment_method, status)
         values ($1,$2,$3, current_date - ($4 || ' days')::interval, $5,0,$6,$7,$8,'cash','completed') returning id`,
        [customerId, salesId, `INV-200${i + 1}`, String(Math.max(0, 29 - i * 2)), subtotal, discount, total, paid])).rows[0];
      for (const l of lines) {
        await c.query('insert into public.sales_items (sale_id,product_id,quantity,unit_price,line_total) values ($1,$2,$3,$4,$5)', [sale.id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]);
        await c.query('update public.products set stock = greatest(0, stock - $1) where id=$2', [l.quantity, l.product_id]);
      }
      if (total - paid > 0) await c.query('update public.customers set outstanding_due = outstanding_due + $1 where id=$2', [total - paid, customerId]);
    });
  }
  console.log('  · 8 purchases, 16 sales');

  console.log('\n✅ Seed complete. Log in (password: password123):');
  console.log('   super@agrojatra.com · admin@agrojatra.com · inventory@agrojatra.com');
  console.log('   sales@agrojatra.com · accountant@agrojatra.com · viewer@agrojatra.com');
  await pool.end();
}

main().catch(async (err) => { console.error('❌ Seed failed:', err.message); await pool.end(); process.exit(1); });
