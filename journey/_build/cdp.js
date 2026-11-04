'use strict';
/**
 * _build/cdp.js — a tiny DevTools-protocol client for this repo's tools.
 *
 * No npm dependencies: it uses node's built-in WebSocket (node 22+) and fetch.
 * Exported for smoke.js (the test suite) and probe.js (ad-hoc poking).
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Find a Chromium binary: CHROME_BIN, the Playwright cache, then /Applications. */
function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const tries = [];
  if (fs.existsSync(cache)) {
    for (const dir of fs.readdirSync(cache)) {
      if (dir.startsWith('chromium_headless_shell')) {
        tries.push(path.join(cache, dir, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'));
        tries.push(path.join(cache, dir, 'chrome-headless-shell-linux64/chrome-headless-shell'));
      }
      if (dir.startsWith('chromium-')) {
        tries.push(path.join(cache, dir, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'));
      }
    }
  }
  tries.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  tries.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome');
  for (const t of tries) if (t && fs.existsSync(t)) return t;
  return null;
}

async function launch() {
  const bin = findChrome();
  if (!bin) throw new Error('No Chromium found. Set CHROME_BIN, or run `npx playwright install chromium`.');
  const port = 9300 + Math.floor(Math.random() * 400);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'jp-cdp-'));
  // --no-sandbox is required where the setuid sandbox is unavailable; without it
  // the renderer dies before DevTools can answer. chrome-headless-shell is
  // already headless, so no --headless flag.
  const proc = spawn(bin, [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return { proc, port, profile, bin };
    } catch (e) { /* not up yet */ }
    await sleep(150);
  }
  proc.kill();
  throw new Error('Chromium did not open a debugging port');
}

class Client {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.diag = [];
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', rej, { once: true });
    });
    this.ws.addEventListener('message', ev => this._onMessage(ev.data));
    this.on('Runtime.consoleAPICalled', p => {
      if (p.type !== 'error' && p.type !== 'warning') return;
      const text = (p.args || []).map(a => a.value !== undefined ? a.value : a.description || a.type).join(' ');
      this.diag.push({ kind: p.type, text });
    });
    this.on('Runtime.exceptionThrown', p => {
      const d = p.exceptionDetails || {};
      this.diag.push({ kind: 'exception', text: (d.exception && d.exception.description) || d.text || 'exception' });
    });
    this.on('Log.entryAdded', p => {
      const e = p.entry || {};
      if (e.level === 'error') this.diag.push({ kind: 'log', text: `${e.text} ${e.url || ''}`.trim() });
    });
    this.on('Network.responseReceived', p => {
      const r = p.response || {};
      if (r.status >= 400) this.diag.push({ kind: 'http', text: `${r.status} ${r.url}` });
    });
    this.on('Network.loadingFailed', p => {
      if (p.canceled) return;
      this.diag.push({ kind: 'net', text: `${p.errorText} ${p.requestId}` });
    });
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }

  _onMessage(raw) {
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.id && this.pending.has(m.id)) {
      const { resolve, reject } = this.pending.get(m.id);
      this.pending.delete(m.id);
      if (m.error) reject(new Error(`${m.error.message} (${m.error.code})`));
      else resolve(m.result);
      return;
    }
    for (const fn of this.listeners.get(m.method) || []) {
      try { fn(m.params); } catch (e) { /* never let a listener kill the run */ }
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 20000);
    });
  }

  /** Evaluate an expression in the page's global scope and return its value. */
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, userGesture: true,
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error((d.exception && d.exception.description) || d.text || 'eval failed');
    }
    return r.result ? r.result.value : undefined;
  }

  /** Screenshot to a file. Returns the path. */
  async shot(file) {
    const r = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }

  close() { try { this.ws.close(); } catch (e) {} }
}

async function newPage(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const target = await r.json();
  const c = new Client(target.webSocketDebuggerUrl);
  await c.open();
  await c.send('Page.enable');
  await c.send('Runtime.enable');
  await c.send('Network.enable');
  await c.send('Log.enable');
  return c;
}

/**
 * Navigate and wait until the NEW document is actually live.
 *
 * Page.loadEventFired is unreliable here: listeners accumulate and a stale
 * event from the previous document can resolve the wait, so subsequent
 * evaluate() calls hit the old page and tests read yesterday's state.
 * Polling location.href + readyState cannot race that way.
 */
async function goto(c, url, timeout = 15000) {
  await c.send('Page.navigate', { url });
  const deadline = Date.now() + timeout;
  let live = false;
  while (Date.now() < deadline) {
    try {
      const s = await c.evaluate(`({href: location.href, rs: document.readyState})`);
      if (s.href === url && s.rs === 'complete') { live = true; break; }
    } catch (e) { /* context destroyed mid-navigation */ }
    await sleep(120);
  }
  if (!live) {
    // The URL may have redirected (an apex forward, for example). If a document
    // is complete by now, it is the landing page: accept it and record where we
    // actually ended up.
    const s = await c.evaluate(`({href: location.href, rs: document.readyState})`).catch(() => null);
    if (!s || s.rs !== 'complete') throw new Error(`navigation to ${url} did not settle`);
    c.currentUrl = s.href;
    c.redirectedFrom = url;
    await sleep(350);
    return;
  }
  c.currentUrl = url;
  await sleep(350);
}

/**
 * Hard reload. Needed because Page.navigate to the identical URL is a
 * same-document navigation in current Chrome: it does not re-run the page.
 */
async function reload(c) {
  const loaded = new Promise(res => {
    c.on('Page.loadEventFired', () => res());
  });
  await c.send('Page.reload', { ignoreCache: true });
  await Promise.race([loaded, sleep(12000)]);
  await sleep(500);
}

async function viewport(c, width, height, mobile = false) {
  await c.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile });
}

/** One browser + one page, cleaned up no matter what. */
async function withPage(fn, opts = {}) {
  const browser = await launch();
  const c = await newPage(browser.port);
  try {
    if (opts.viewport) await viewport(c, opts.viewport[0], opts.viewport[1], !!opts.mobile);
    return await fn(c, browser);
  } finally {
    c.close();
    browser.proc.kill();
    try { fs.rmSync(browser.profile, { recursive: true, force: true }); } catch (e) {}
  }
}

module.exports = { findChrome, launch, Client, newPage, goto, reload, viewport, withPage, sleep };
