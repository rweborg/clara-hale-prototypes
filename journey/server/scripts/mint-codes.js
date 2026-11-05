#!/usr/bin/env node
/**
 * Mint mock Etsy redeem codes for a case.
 *
 *   node scripts/mint-codes.js --slug clara-hale --count 5
 *   node scripts/mint-codes.js --slug clara-hale --sku MOCK-CLARA-HALE --count 10
 *
 * Prints the codes once. The database keeps only a hash and a hint.
 * This does not call Etsy. Real receipt matching can insert the same
 * redeem_codes rows later with an order id.
 */
import { defaultEnvPath, loadConfig, loadEnvFile } from '../src/config.js';
import { closePool } from '../src/db.js';
import { migrate } from '../src/migrate.js';
import { mintCodes } from '../src/commerce.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1];
}

loadEnvFile(process.env.CASE_DESK_ENV || defaultEnvPath);
const config = loadConfig();
if (!config.databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const slug = arg('--slug', 'clara-hale');
const count = Number(arg('--count', '1'));
const sku = arg('--sku', '');

try {
  await migrate();
  const result = await mintCodes({ slug, count, sku, config });
  console.log('');
  console.log(`MOCK Etsy codes for ${result.slug} (SKU ${result.sku})`);
  console.log('Practice codes only — not real Etsy orders. Not stored in full.');
  console.log('');
  for (const code of result.codes) console.log('  ' + code);
  console.log('');
} catch (err) {
  console.error(err.message || err);
  process.exitCode = 1;
} finally {
  await closePool();
}
