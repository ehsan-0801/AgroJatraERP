/**
 * Promote a user to Super Admin by email.
 *   npm run make-superadmin -- someone@example.com
 */
import { pool, query } from './pool.js';

async function main() {
  const email = process.argv[2];
  if (!email) { console.error('Usage: npm run make-superadmin -- <email>'); process.exit(1); }
  const { rows } = await query(
    `update public.users set role='super_admin', status='active' where lower(email)=lower($1) returning email, role`,
    [email]);
  if (!rows[0]) { console.error(`❌ No user found with email ${email}. They must sign up first.`); await pool.end(); process.exit(1); }
  console.log(`✅ ${rows[0].email} is now ${rows[0].role}`);
  await pool.end();
}
main().catch(async (e) => { console.error('❌', e.message); await pool.end(); process.exit(1); });
