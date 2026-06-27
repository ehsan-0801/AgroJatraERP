import pg from 'pg';
import { env } from '../config/env.js';

// Strip libpq SSL params from the URL so they don't force `verify-full`;
// we control TLS explicitly via the `ssl` option below (Supabase uses a
// certificate chain that isn't in Node's default trust store).
function cleanUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.delete('sslmode');
  u.searchParams.delete('supa');
  return u.toString();
}

export const pool = new pg.Pool({
  connectionString: cleanUrl(env.databaseUrl),
  ssl: { rejectUnauthorized: false },
  max: 10,
  // Keep connections warm so we don't pay a fresh TLS handshake to the
  // Supabase DB (us-east-1) on every request after a short idle period —
  // that handshake is what caused the occasional multi-second responses.
  keepAlive: true,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 15_000,
});

// Prime one connection at startup so the first request is fast, and keep at
// least one connection alive with a lightweight periodic ping.
pool.query('select 1').catch(() => {});
setInterval(() => {
  pool.query('select 1').catch(() => {});
}, 50_000).unref();

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as never);
}

/** Run a set of statements inside a single transaction. */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
