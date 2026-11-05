/* The Case Desk — account panel.
   Loaded after the engine. Does nothing unless the platform server marked
   this page (a <meta name="case-desk"> tag). Static hosting and the smoke
   suite never get that tag, so they never call the API and the anonymous
   game is unchanged. Progress still saves in localStorage either way. */
(function () {
  'use strict';
  if (!document.querySelector('meta[name="case-desk"]')) return;
  if (!window.CASE_PACK || !window.__jp) return;

  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slug = window.CASE_PACK.id;
  const IGNORE = { savedAt: 1, sel: 1, connect: 1, strSel: 1, fresh: 1, _sc: 1 };

  let me = null;
  let sessionId = null;
  let completed = false;
  let syncBlocked = false;
  let pending = null;
  let lastSent = null;
  let timer = null;
  let flushing = false;
  let panelOpen = false;

  function contentOf(snap) {
    if (!snap) return '';
    const o = {};
    for (const k in snap) if (!IGNORE[k]) o[k] = snap[k];
    return JSON.stringify(o);
  }
  function usable(o) {
    if (!o || !o.beat || o.beat === 'intro') return false;
    return (window.CASE_PACK.beats || []).some((b) => b[0] === o.beat);
  }
  function changedKeys(prev, next) {
    const keys = new Set(Object.keys(prev || {}).concat(Object.keys(next || {})));
    const out = [];
    for (const k of keys) {
      if (IGNORE[k]) continue;
      if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) out.push(k);
    }
    return out;
  }
  function diff(prev, next) {
    if (!prev) return [{ kind: 'progress', payload: { beat: next.beat, reason: 'claim' } }];
    const events = [];
    if (prev.beat !== next.beat) events.push({ kind: 'beat', payload: { beat: next.beat, from: prev.beat } });
    const pulled = Object.keys(next.pulled || {}).filter((id) => !(prev.pulled || {})[id]);
    if (pulled.length) events.push({ kind: 'evidence', payload: { pulled: pulled.slice(0, 40) } });
    if (JSON.stringify(prev.board) !== JSON.stringify(next.board) || JSON.stringify(prev.strings) !== JSON.stringify(next.strings)) {
      events.push({ kind: 'board', payload: { board: next.board || {}, strings: next.strings || [] } });
    }
    if (JSON.stringify(prev.notes) !== JSON.stringify(next.notes)) {
      const notes = (next.notes || []).slice(-5).map((n) => ({ t: String(n.t || '').slice(0, 240), cls: n.cls || '' }));
      events.push({ kind: 'note', payload: { notes } });
    }
    if (JSON.stringify(prev.env) !== JSON.stringify(next.env)) events.push({ kind: 'envelope', payload: { env: next.env || {} } });
    if (prev.solved !== next.solved || prev.filed !== next.filed || prev.obj1 !== next.obj1 || prev.real !== next.real || prev.tries !== next.tries) {
      events.push({ kind: 'progress', payload: { obj1: next.obj1, real: !!next.real, solved: !!next.solved, filed: !!next.filed, tries: next.tries || 0 } });
    }
    if (!events.length) {
      const changed = changedKeys(prev, next);
      if (changed.length) events.push({ kind: 'desk', payload: { changed: changed.slice(0, 24) } });
    }
    return events;
  }
  function eventId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'ev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function api(method, path, body, keepalive) {
    const res = await fetch(path, {
      method,
      credentials: 'same-origin',
      keepalive: !!keepalive,
      headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    return { ok: res.ok, status: res.status, data };
  }

  const root = document.createElement('div');
  root.id = 'acct';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Your desk');
  document.body.appendChild(root);
  const style = document.createElement('style');
  style.textContent = '#acct{position:fixed;z-index:90;top:calc(var(--bar-h,64px) + 8px);right:12px;width:min(380px,calc(100vw - 16px));max-height:calc(100dvh - var(--bar-h,64px) - 24px);overflow:auto;background:#fff;color:var(--ds-ink,#1D1B18);border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.28);padding:16px 16px 18px;font-family:Atkinson,Arial,sans-serif}'
    + '#acct h2{font:700 22px Atkinson;margin:0 0 6px}#acct p{font-size:14.5px;line-height:1.45;margin:6px 0;color:#4A443C}'
    + '#acct label{display:block;font:700 13px Atkinson;margin:10px 0 4px}#acct input,#acct textarea{width:100%;border:1.5px solid #D9D2C6;border-radius:10px;padding:10px 12px;font:16px Atkinson}'
    + '#acct .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#acct button.act{border:none;border-radius:10px;background:var(--ds-pine,#1F5E4E);color:#fff;font:700 15px Atkinson;min-height:44px;padding:0 14px}'
    + '#acct button.quiet{border:1.5px solid #CFC6B8;background:#fff;color:inherit;border-radius:10px;font:700 14px Atkinson;min-height:44px;padding:0 12px}'
    + '#acct .code{font-family:CourierP,monospace;background:#FBFAF4;border-radius:8px;padding:8px 10px}#acct .status{font-size:13px;color:#1F5E4E;min-height:1.2em}'
    + '#acct .err{color:#B3261E;font-weight:700}#acct a{color:#1F5E4E}';
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tb';
  btn.id = 'acctb';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="glyph" aria-hidden="true">🗂</span><span class="lbl">Desk</span>';
  const gear = document.getElementById('dzb');
  if (gear && gear.parentNode) gear.parentNode.insertBefore(btn, gear);
  else document.body.appendChild(btn);

  function setOpen(on) {
    panelOpen = on;
    root.hidden = !on;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) { const dz = document.getElementById('dz'); if (dz) dz.hidden = true; }
  }
  btn.onclick = () => setOpen(!panelOpen);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panelOpen) setOpen(false); });

  function status(text, bad) {
    const el = root.querySelector('[data-status]');
    if (!el) return;
    el.className = bad ? 'err' : 'status';
    el.textContent = text || '';
  }

  function paint() {
    if (!me) {
      root.innerHTML = '<h2>Save your place</h2>'
        + '<p>Your progress already stays on this device. Sign in if you want it on your Case Desk too, so another device can pick it up.</p>'
        + '<form><label for="acctemail">Email</label><input id="acctemail" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com">'
        + '<div class="row"><button class="act" type="submit">Email me a link</button></div></form>'
        + '<p data-status class="status" role="status"></p><p data-dev hidden></p>'
        + '<p><a href="/library">Open your library</a></p>';
      root.querySelector('form').onsubmit = onEmail;
      return;
    }
    const cases = (me.entitlements || []).map((e) => '<li>' + esc(e.title) + '</li>').join('');
    root.innerHTML = '<h2>Your desk</h2>'
      + '<p>Signed in as <b>' + esc(me.user.displayName || me.user.email) + '</b>.</p>'
      + '<p data-status class="status" role="status">This device keeps a copy. Signed-in progress also saves to your desk.</p>'
      + (cases ? '<p>From your codes:</p><ul>' + cases + '</ul>' : '<p>Clara Hale is included. A code from a purchase adds another case.</p>')
      + '<form data-redeem><label for="acctcode">Add a case with a code</label><input id="acctcode" maxlength="32" autocapitalize="characters" autocomplete="off" placeholder="CD-XXXX-XXXX-XXXX">'
      + '<div class="row"><button class="act" type="submit">Add to my desk</button></div></form>'
      + '<p data-redeemmsg></p>'
      + '<div class="row"><button class="quiet" type="button" data-practice>Get a practice code</button><a class="quiet" href="/library" style="display:inline-flex;align-items:center;text-decoration:none;padding:0 12px">Library</a></div>'
      + '<p class="status" data-practicenote>Practice codes are not a real Etsy purchase. The shop is not open yet.</p>'
      + '<p data-practice class="code" hidden></p>'
      + '<form data-rate><label>How was this case? <span data-stars></span></label>'
      + '<input data-note maxlength="500" placeholder="A short note (optional)">'
      + '<div class="row"><button class="act" type="submit">Save rating</button><button class="quiet" type="button" data-out>Sign out</button></div></form>';
    root.querySelector('[data-redeem]').onsubmit = onRedeem;
    root.querySelector('[data-practice]').onclick = onPractice;
    root.querySelector('[data-rate]').onsubmit = onRate;
    root.querySelector('[data-out]').onclick = onOut;
    paintStars(0);
    const params = new URLSearchParams(location.search);
    if (params.get('code')) root.querySelector('#acctcode').value = params.get('code');
  }
  function paintStars(n) {
    const box = root.querySelector('[data-stars]');
    if (!box) return;
    box.innerHTML = '';
    box.dataset.value = String(n || 0);
    for (let i = 1; i <= 5; i += 1) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = i <= n ? '★' : '☆';
      b.style.border = 'none';
      b.style.background = 'transparent';
      b.style.font = '700 20px Atkinson';
      b.style.minWidth = '32px';
      b.setAttribute('aria-label', i + ' stars');
      b.onclick = () => paintStars(i);
      box.appendChild(b);
    }
  }

  async function onEmail(e) {
    e.preventDefault();
    status('Sending…');
    const email = root.querySelector('#acctemail').value;
    let res;
    try { res = await api('POST', '/api/auth/request', { email }); }
    catch (err) { status('Could not reach the desk. Your progress is still on this device.', true); return; }
    if (!res.ok) { status(res.data.error || 'Could not send the link.', true); return; }
    if (res.data.devLink) {
      status('Email isn’t connected here yet. Open this link in this browser:');
      const p = root.querySelector('[data-dev]');
      p.hidden = false;
      p.innerHTML = '<a href="' + esc(res.data.devLink) + '">' + esc(res.data.devLink) + '</a>';
      return;
    }
    status('Check your email, and open the link in this browser.');
  }
  async function onRedeem(e) {
    e.preventDefault();
    const el = root.querySelector('[data-redeemmsg]');
    el.textContent = 'Checking…';
    const res = await api('POST', '/api/redeem', { code: root.querySelector('#acctcode').value });
    if (!res.ok) { el.className = 'err'; el.textContent = res.data.error || 'That code did not work.'; return; }
    el.className = 'status';
    el.textContent = (res.data.entitlement.title || 'That case') + ' is on your desk.';
    await loadMe();
  }
  async function onPractice() {
    const res = await api('POST', '/api/commerce/mock-purchase', { slug });
    const p = root.querySelector('[data-practice]');
    if (!res.ok) { status(res.data.error || 'Practice codes are turned off.', true); return; }
    p.hidden = false;
    p.textContent = res.data.code + ' — practice only, not a real order';
    const input = root.querySelector('#acctcode');
    if (input) input.value = res.data.code;
    status(res.data.label || 'Practice code ready.');
  }
  async function onRate(e) {
    e.preventDefault();
    const n = Number((root.querySelector('[data-stars]') || {}).dataset.value || 0);
    if (!n) { status('Choose a star first.', true); return; }
    const note = root.querySelector('[data-note]').value;
    const res = await api('PUT', '/api/cases/' + encodeURIComponent(slug) + '/rating', { stars: n, body: note });
    status(res.ok ? 'Rating saved.' : (res.data.error || 'Could not save that.'), !res.ok);
  }
  async function onOut() {
    await api('POST', '/api/auth/logout');
    me = null;
    sessionId = null;
    window.CaseDesk.signedIn = false;
    paint();
  }

  async function ensureSession() {
    if (sessionId || syncBlocked) return sessionId;
    const opened = await api('POST', '/api/cases/' + encodeURIComponent(slug) + '/sessions');
    if (!opened.ok) {
      syncBlocked = opened.status === 403;
      if (syncBlocked) status('Redeem a code to save this case to your account. This device still has it.');
      return null;
    }
    sessionId = opened.data.session.id;
    completed = opened.data.session.status === 'completed';
    return sessionId;
  }

  async function flushNow(keepalive) {
    if (flushing || !me || !pending) return;
    const snap = pending;
    if (lastSent && contentOf(lastSent) === contentOf(snap)) { pending = null; return; }
    flushing = true;
    pending = null;
    try {
      const id = await ensureSession();
      if (!id) { pending = snap; return; }
      const events = diff(lastSent, snap).map((event) => Object.assign({ clientEventId: eventId() }, event));
      if (events.length) {
        const posted = await api('POST', '/api/sessions/' + id + '/events', { events }, keepalive);
        if (!posted.ok && posted.status !== 409) { pending = snap; return; }
      }
      const saved = await api('PUT', '/api/sessions/' + id + '/checkpoints/resume', { summary: snap }, keepalive);
      if (!saved.ok) { pending = snap; return; }
      if (snap.filed && !completed) {
        const done = await api('POST', '/api/sessions/' + id + '/complete', {}, keepalive);
        if (done.ok) completed = true;
      }
      lastSent = snap;
      status('Saved to your desk.');
    } catch (e) {
      pending = snap;
      status('Couldn’t reach your desk. This device still has your progress.');
    } finally {
      flushing = false;
      if (pending) schedule();
    }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { flushNow(false); }, 800);
  }

  window.CaseDesk = {
    signedIn: false,
    applying: false,
    // Called as a bare function from the engine, so this is not the object.
    onLocalSave(snapshot) {
      if (!window.CaseDesk.signedIn || window.CaseDesk.applying || syncBlocked) return;
      pending = snapshot;
      schedule();
    },
    onClear() {
      const id = sessionId;
      sessionId = null;
      completed = false;
      lastSent = null;
      pending = null;
      if (!id || !window.CaseDesk.signedIn) return;
      api('POST', '/api/sessions/' + id + '/abandon').catch(() => {});
    },
  };

  async function loadMe() {
    const res = await api('GET', '/api/me');
    if (!res.ok || !res.data.user) { me = null; window.CaseDesk.signedIn = false; paint(); return; }
    me = res.data;
    window.CaseDesk.signedIn = true;
    paint();
    const shop = await api('GET', '/api/commerce/etsy?slug=' + encodeURIComponent(slug));
    if (!shop.ok || !shop.data.practice) {
      const practice = root.querySelector('[data-practice]');
      const note = root.querySelector('[data-practicenote]');
      if (practice) practice.hidden = true;
      if (note) note.hidden = true;
    }
    const rate = await api('GET', '/api/cases/' + encodeURIComponent(slug) + '/rating');
    if (rate.ok && rate.data.mine) paintStars(rate.data.mine.stars);
    if (window.__jp.preview && window.__jp.preview()) return;
    const cur = await api('GET', '/api/cases/' + encodeURIComponent(slug) + '/sessions/current');
    if (!cur.ok) return;
    if (cur.data.session) {
      sessionId = cur.data.session.id;
      completed = cur.data.session.status === 'completed';
    }
    const summary = cur.data.checkpoint && cur.data.checkpoint.summary;
    const local = window.__jp.loadSave();
    const serverOk = usable(summary);
    const localOk = usable(local);
    const serverNewer = serverOk && (!localOk || (contentOf(summary) !== contentOf(local) && (summary.savedAt || 0) >= (local.savedAt || 0)));
    if (serverNewer && window.__jp.resume) {
      window.CaseDesk.applying = true;
      window.__jp.resume(summary, { quiet: !!localOk });
      window.CaseDesk.applying = false;
      lastSent = window.__jp.loadSave() || summary;
      status('Picked up your saved desk.');
      return;
    }
    if (localOk && (!serverOk || contentOf(local) !== contentOf(summary))) {
      pending = local;
      lastSent = serverOk ? summary : null;
      flushNow(false);
    }
  }

  window.addEventListener('pagehide', () => { if (pending && me) flushNow(true); });
  const params = new URLSearchParams(location.search);
  if (params.get('code')) setOpen(true);
  loadMe().catch(() => paint());
})();
