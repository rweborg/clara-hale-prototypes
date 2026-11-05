import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required');
    }
    pool = new Pool({ connectionString, max: 8 });
  }
  return pool;
}

export async function closePool() {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}

/** @param {import('pg').Pool | import('pg').PoolClient} db */
export async function withTx(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* already aborted */ }
    throw err;
  } finally {
    client.release();
  }
}
