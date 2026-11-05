import path from 'node:path';
import { defaultEnvPath, loadConfig, loadEnvFile } from './config.js';
import { createApp } from './app.js';
import { migrate } from './migrate.js';

loadEnvFile(process.env.CASE_DESK_ENV || defaultEnvPath);
const config = loadConfig();

if (!config.databaseUrl) {
  console.error('[case-desk] DATABASE_URL is required');
  process.exit(1);
}
if (config.production && !config.resendApiKey) {
  console.warn('[case-desk] RESEND_API_KEY is unset. Sign-in email is off until it is set. The game still plays without an account.');
}
if (!config.production && config.sessionSecret === 'dev-only-not-for-production') {
  console.warn('[case-desk] SESSION_SECRET is unset. Using a dev-only default. Set one before any shared deploy.');
}

await migrate();
const app = createApp(config);
app.listen(config.port, '0.0.0.0', () => {
  console.log(`[case-desk] listening on ${config.port} (${config.nodeEnv}) static ${path.resolve(config.staticRoot)}`);
  if (config.mockCommerce) console.log('[case-desk] mock Etsy practice codes are on. No Etsy API is called.');
});
