import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import { loadConfig } from './config.js';
import { getPool } from './db.js';
import { createRateLimiter } from './rateLimit.js';
import { HttpError, clientIp, normalizeSlug, wrap } from './http.js';
import {
  loadUser,
  logout,
  me,
  requestMagicLink,
  requireAdmin,
  requireUser,
  updateMe,
  verifyMagicLink,
} from './auth.js';
import { getCaseBySlug, listPublicCases, presentCase, ratingFor, upsertRating } from './catalog.js';
import { etsyBridge, listCodeHints, mintCodes, mockPurchase, redeemCode } from './commerce.js';
import { adminSummary } from './admin.js';
import {
  appendEvents,
  currentSession,
  openSession,
  readSession,
  saveCheckpoint,
  sessionPayload,
  setStatus,
} from './sessions.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function cacheControl(urlPath) {
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (urlPath.startsWith('/app/') || urlPath.startsWith('/cases/') || urlPath.startsWith('/design-system/')) {
    return 'public, max-age=300, must-revalidate';
  }
  if (urlPath.endsWith('.html') || urlPath === '/') return 'no-cache';
  return null;
}

export function createApp(config = loadConfig()) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const authLimit = createRateLimiter({ limit: config.authRateLimit, windowMs: config.rateWindowMs });
  const redeemLimit = createRateLimiter({ limit: config.redeemRateLimit, windowMs: config.rateWindowMs });
  const mockLimit = createRateLimiter({ limit: config.mockRateLimit, windowMs: config.rateWindowMs });

  app.use(compression());
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('X-Frame-Options', 'SAMEORIGIN');
    if (config.production) {
      res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });
  app.use(express.json({ limit: '200kb' }));

  app.get('/health', wrap(async (req, res) => {
    try {
      await getPool().query('SELECT 1');
      res.json({ ok: true, service: 'case-desk', db: true });
    } catch {
      res.status(503).json({ ok: false, service: 'case-desk', db: false });
    }
  }));

  app.post('/api/auth/request', wrap(async (req, res) => {
    await requestMagicLink(req, res, config, authLimit);
  }));
  app.get('/api/auth/verify', wrap(async (req, res) => {
    await verifyMagicLink(req, res, config);
  }));
  app.post('/api/auth/logout', wrap(async (req, res) => {
    await logout(req, res, config);
  }));

  app.get('/api/me', wrap(async (req, res) => {
    const user = await loadUser(req, config);
    if (!user) return res.json({ user: null, entitlements: [], admin: false });
    req.user = user;
    res.json(await me(req, config));
  }));
  app.patch('/api/me', requireUser(config), wrap(async (req, res) => {
    res.json(await updateMe(req));
  }));

  app.get('/api/cases', wrap(async (req, res) => {
    res.json({ cases: await listPublicCases() });
  }));
  app.get('/api/cases/:slug', wrap(async (req, res) => {
    const slug = normalizeSlug(req.params.slug);
    const row = slug ? await getCaseBySlug(slug, { liveOnly: true }) : null;
    if (!row) throw new HttpError(404, 'No case by that name.');
    res.json({ case: presentCase(row) });
  }));
  app.get('/api/cases/:slug/rating', wrap(async (req, res) => {
    const user = await loadUser(req, config);
    res.json(await ratingFor(user?.id, req.params.slug));
  }));
  app.put('/api/cases/:slug/rating', requireUser(config), wrap(async (req, res) => {
    res.json(await upsertRating(req.user.id, req.params.slug, req.body));
  }));

  app.get('/api/commerce/etsy', wrap(async (req, res) => {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
    res.json(await etsyBridge(slug, config));
  }));
  app.post('/api/commerce/mock-purchase', requireUser(config), wrap(async (req, res) => {
    res.json(await mockPurchase(req.user, req.body?.slug, config, mockLimit));
  }));
  app.post('/api/redeem', requireUser(config), wrap(async (req, res) => {
    const user = { id: req.user.id, ip: clientIp(req) };
    res.json(await redeemCode(user, req.body?.code, config, redeemLimit));
  }));

  app.post('/api/cases/:slug/sessions', requireUser(config), wrap(async (req, res) => {
    const opened = await openSession(req.user.id, req.params.slug);
    const payload = await sessionPayload(opened.row, req.user.id);
    res.status(opened.resumed ? 200 : 201).json({ ...payload, resumed: opened.resumed });
  }));
  app.get('/api/cases/:slug/sessions/current', requireUser(config), wrap(async (req, res) => {
    const current = await currentSession(req.user.id, req.params.slug);
    res.json(current || { session: null, participants: [], checkpoint: null, events: [] });
  }));
  app.get('/api/sessions/:id', requireUser(config), wrap(async (req, res) => {
    res.json(await readSession(req.user.id, req.params.id));
  }));
  app.post('/api/sessions/:id/events', requireUser(config), wrap(async (req, res) => {
    res.json(await appendEvents(req.user.id, req.params.id, req.body));
  }));
  app.put('/api/sessions/:id/checkpoints/:name', requireUser(config), wrap(async (req, res) => {
    res.json(await saveCheckpoint(req.user.id, req.params.id, req.params.name, req.body));
  }));
  app.post('/api/sessions/:id/abandon', requireUser(config), wrap(async (req, res) => {
    res.json(await setStatus(req.user.id, req.params.id, 'abandoned'));
  }));
  app.post('/api/sessions/:id/complete', requireUser(config), wrap(async (req, res) => {
    res.json(await setStatus(req.user.id, req.params.id, 'completed'));
  }));

  app.get('/api/admin/summary', requireAdmin(config), wrap(async (req, res) => {
    res.json(await adminSummary());
  }));
  app.get('/api/admin/codes', requireAdmin(config), wrap(async (req, res) => {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
    res.json({ codes: await listCodeHints(slug) });
  }));
  app.post('/api/admin/codes', requireAdmin(config), wrap(async (req, res) => {
    res.status(201).json(await mintCodes({
      slug: req.body?.slug,
      count: req.body?.count,
      sku: req.body?.sku,
      config,
    }));
  }));

  const library = path.join(here, '../public/library.html');
  const admin = path.join(here, '../public/admin.html');
  app.get('/library', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(library);
  });
  app.get('/admin', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(admin);
  });

  // The game shell is the file on disk, plus one meta tag so account.js
  // knows this response came from the platform. Static file servers (and the
  // smoke suite) do not inject it, so they never call the API.
  const indexPath = path.join(config.staticRoot, 'index.html');
  const sendGame = (req, res, next) => {
    fs.readFile(indexPath, 'utf8', (err, html) => {
      if (err) return next();
      if (!html.includes('name="case-desk"')) {
        html = html.replace('</head>', '<meta name="case-desk" content="on"></head>');
      }
      res.set('Cache-Control', 'no-cache');
      res.type('html').send(html);
    });
  };
  app.get('/', sendGame);
  app.get('/index.html', sendGame);

  app.use((req, res, next) => {
    if (req.path.startsWith('/server') || req.path.startsWith('/_build') || req.path.includes('..')) {
      return res.status(404).type('text').send('Not found');
    }
    next();
  });

  app.use(express.static(config.staticRoot, {
    index: false,
    dotfiles: 'ignore',
    fallthrough: true,
    setHeaders(res, filePath) {
      const rel = '/' + path.relative(config.staticRoot, filePath).split(path.sep).join('/');
      const value = cacheControl(rel);
      if (value) res.set('Cache-Control', value);
    },
  }));

  app.use((req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found.' });
    res.status(404).type('text').send('Not found');
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status
      || (err.type === 'entity.parse.failed' ? 400 : 0)
      || (err.type === 'entity.too.large' ? 413 : 500);
    if (status >= 500 && !(err instanceof HttpError)) console.error('[case-desk]', err.message);
    if (err.retryAfter) res.set('Retry-After', String(err.retryAfter));
    // HttpError messages are written for players. Unexpected failures stay generic
    // so a database error never becomes the text on the page.
    let message;
    if (err.type === 'entity.parse.failed') message = 'That request could not be read.';
    else if (err.type === 'entity.too.large') message = 'That is too large to save.';
    else if (err instanceof HttpError) message = err.message;
    else if (status >= 500) message = 'Something went wrong.';
    else message = err.message || 'Something went wrong.';
    if (req.path.startsWith('/api') || wantsJsonSafe(req)) res.status(status).json({ error: message });
    else res.status(status).type('text').send(message);
  });

  return app;
}

function wantsJsonSafe(req) {
  return String(req.headers.accept || '').includes('application/json');
}
