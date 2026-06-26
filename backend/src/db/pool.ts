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
});

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
