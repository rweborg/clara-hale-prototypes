import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultEnvPath, loadEnvFile } from './config.js';
import { closePool, getPool } from './db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '../migrations');

export async function migrate() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const files = fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
  for (const file of files) {
    const seen = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file]);
    if (seen.rowCount) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[case-desk] applied ${file}`);
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    } finally {
      client.release();
    }
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  loadEnvFile(defaultEnvPath);
  migrate()
    .then(async () => {
      console.log('[case-desk] migrations up to date');
      await closePool();
    })
    .catch(async (err) => {
      console.error('[case-desk] migration failed:', err.message);
      await closePool();
      process.exit(1);
    });
}
