import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/** Service-role client — full access, used for auth admin + token verification. */
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Anon client — used for password sign-in / sign-up flows. */
export const supabaseAnon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
