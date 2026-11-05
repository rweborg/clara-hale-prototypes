#!/usr/bin/env node
'use strict';
/**
 * _build/gen_portraits.js — generate the portraits with a hosted image model.
 *
 *   REPLICATE_API_TOKEN=r8_... node _build/gen_portraits.js clara-hale
 *   node _build/gen_portraits.js clara-hale --dry        # print, do not send
 *   node _build/gen_portraits.js clara-hale --force      # redo existing files
 *   node _build/gen_portraits.js clara-hale --only clara,daniel
 *
 * The prompt for each portrait comes from the case's provenance, through
 * prompts.js — the same text `node _build/prompts.js` writes to prompts.md.
 *
 * Defaults to deepseek-ai/janus-pro-7b. Janus-Pro renders 384x384, so treat
 * these as plates, not finals: run `python3 _build/plates.py` afterwards, which
 * crops, grades, grains and frames them. Use --model to point at a stronger
 * model later; the script only needs it to accept a `prompt`.
 *
 * The token is read from the environment and never written anywhere. Do not
 * commit it, and do not paste it into a chat.
 */

const fs = require('node:fs');
const path = require('node:path');
const { loadPack, promptFor } = require('./prompts');

const ROOT = path.resolve(__dirname, '..');
const API = 'https://api.replicate.com/v1';

const argv = process.argv.slice(2);
const caseId = argv.find(a => !a.startsWith('--')) || 'clara-hale';
const dry = argv.includes('--dry');
const force = argv.includes('--force');
const modelFlag = argv.indexOf('--model');
const modelsFlag = argv.indexOf('--models');
const outDirFlag = argv.indexOf('--out-dir');
const outDir = outDirFlag >= 0 ? argv[outDirFlag + 1] : null;

/** Short names expand to the Black Forest Labs models; anything with a slash is used as-is. */
const full = m => (m.includes('/') ? m : `black-forest-labs/${m}`);
const models = modelsFlag >= 0
  ? argv[modelsFlag + 1].split(',').map(m => full(m.trim()))
  : [modelFlag >= 0 ? argv[modelFlag + 1] : 'deepseek-ai/janus-pro-7b'];
let model = models[0];
const onlyFlag = argv.indexOf('--only');
const only = onlyFlag >= 0 ? argv[onlyFlag + 1].split(',') : null;

const TOKEN = process.env.REPLICATE_API_TOKEN;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(pathname, init, attempt = 0) {
  const res = await fetch(API + pathname, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init && init.headers),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch (e) { body = text; }

  // Under $5 credit Replicate allows 6 predictions a minute, so a batch trips
  // the limit. It tells us how long to wait; do that instead of failing.
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const told = body && typeof body === 'object' && body.retry_after;
    const waitMs = told ? told * 1000 : 2000 * (attempt + 1);
    console.log(`         throttled by the API; retrying in ${Math.round(waitMs / 1000)}s`);
    await sleep(waitMs + 300);
    return api(pathname, init, attempt + 1);
  }

  if (!res.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    throw new Error(`${res.status} ${res.statusText}\n${detail}`);
  }
  return body;
}

const VERSIONS = new Map();

/**
 * Community models have no runnable default endpoint: /models/<id>/predictions
 * 404s unless a default version exists. Ask for the latest version instead and
 * call /predictions with it.
 */
async function resolveVersion() {
  if (VERSIONS.has(model)) return VERSIONS.get(model);
  try {
    const m = await api(`/models/${model}`);
    const id = (m.latest_version && m.latest_version.id) || null;
    if (!id) throw new Error('the model has no published version');
    VERSIONS.set(model, id);
  } catch (e) {
    const detail = e.message.split('\n').slice(1).join(' ').slice(0, 300);
    throw new Error(`cannot resolve ${model}: ${e.message.split('\n')[0]} ${detail}`);
  }
  return VERSIONS.get(model);
}

async function generate(prompt, name) {
  const version = await resolveVersion();
  const headers = { Prefer: 'wait=60' };

  // The FLUX models take format and shape knobs; others may reject them.
  // Without output_format, flux-schnell returns WebP bytes under a .jpg name.
  const input = { prompt };
  if (/flux/i.test(model)) {
    input.output_format = 'jpg';
    input.aspect_ratio = '3:4';
  }

  const prediction = await api('/predictions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ version, input }),
  });

  let p = prediction;
  const deadline = Date.now() + 5 * 60 * 1000;
  while (p.status && !['succeeded', 'failed', 'canceled'].includes(p.status)) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${name}`);
    await sleep(2000);
    p = await api(`/predictions/${p.id}`);
  }

  if (p.status !== 'succeeded') {
    throw new Error(`${name}: ${p.status} — ${p.error || 'no error message'}`);
  }
  const out = Array.isArray(p.output) ? p.output[p.output.length - 1] : p.output;
  const url = typeof out === 'string' ? out : out && (out.url || out.image);
  if (!url) throw new Error(`${name}: no image in the response: ${JSON.stringify(p.output)}`);

  const img = await fetch(url);
  if (!img.ok) throw new Error(`${name}: could not download the result`);
  const buf = Buffer.from(await img.arrayBuffer());
  // A wrong-format file under a .jpg name renders by luck; catch it instead.
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) {
    throw new Error(`${name}: the model returned ${buf.subarray(0, 4).toString('hex')} bytes, not JPEG — `
      + 'add output_format jpg for this model');
  }
  return buf;
}

/** --whoami: which account does this token belong to? Useful when credit is
 *  showing on one login and the token belongs to another. */
async function whoami() {
  if (!TOKEN) {
    console.error('REPLICATE_API_TOKEN is not set.');
    process.exit(2);
  }
  try {
    const a = await api('/account');
    console.log(`token belongs to: ${a.username || a.name || '?'} (${a.type || 'personal'})`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

async function main() {
  if (!TOKEN && !dry) {
    console.error('REPLICATE_API_TOKEN is not set.\n');
    console.error('  export REPLICATE_API_TOKEN=r8_...   (from replicate.com/account/api-tokens)');
    console.error('  Then run this again. --dry prints the prompts without sending.\n');
    process.exit(2);
  }

  if (argv.includes('--whoami')) { await whoami(); return; }

  const pack = loadPack(caseId);
  const portraits = pack.portraits || {};
  const keys = Object.keys(portraits).filter(k => !only || only.includes(k.replace(/^p_/, '')));

  console.log(`\n${caseId} · ${model} · ${keys.length} portrait${keys.length === 1 ? '' : 's'}\n`);

  // Resolve before spending anything: if the model id is wrong or has no
  // published version, say so once instead of failing per portrait.
  if (!dry) {
    try {
      const v = await resolveVersion();
      console.log(`  model  ${model} @ ${v.slice(0, 12)}…\n`);
    } catch (e) {
      console.error(e.message + '\n');
      process.exit(1);
    }
  }

  let made = 0, skipped = 0;
  for (const m of models) {
  model = m;
  if (models.length > 1) console.log(`  --- ${m}`);
  for (const key of keys) {
    const rec = portraits[key];
    const name = key.replace(/^p_/, '');
    const out = path.join(ROOT, 'assets', 'portraits', `${name}.jpg`);
    if (!dry && !outDir && fs.existsSync(out) && !force && models.length === 1) {
      console.log(`  skip   ${name.padEnd(10)} already exists (--force to redo)`);
      skipped++;
      continue;
    }
    const prompt = promptFor(rec);
    if (dry) {
      console.log(`  dry    ${name.padEnd(10)} ${prompt.split('\n')[0]}`);
      continue;
    }
    try {
      if (made || skipped) await sleep(1200);   // stay under 6 a minute
      const buf = await generate(prompt, name);
      const target = outDir
        ? path.join(outDir, `${name}--${model.split('/').pop()}.jpg`)
        : out;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, buf);
      console.log(`  ok     ${name.padEnd(10)} ${Math.round(buf.length / 1024)} KB -> ${path.relative(ROOT, target)}`);
      made++;
    } catch (e) {
      console.error(`  FAIL   ${name.padEnd(10)} ${e.message.split('\n')[0]}`);
      const body = e.message.split('\n').slice(1).join(' ').trim();
      if (body) console.error(`         ${body.slice(0, 300)}`);
      console.error(e.message.includes('422')
        ? '         The model rejected the input. Its schema probably wants more than `prompt`;\n'
          + '         open replicate.com/' + model + '/api and check the field names.'
        : '');
    }
  }
  }

  console.log('');
  if (!dry && made) {
    console.log('Next:');
    console.log('  python3 _build/plates.py     # crop, grade, grain and frame them');
    console.log('  node _build/check.js         # contract, browser suite, playthrough');
    console.log('');
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
