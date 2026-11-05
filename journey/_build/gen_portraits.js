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
const model = modelFlag >= 0 ? argv[modelFlag + 1] : 'deepseek-ai/janus-pro-7b';
const onlyFlag = argv.indexOf('--only');
const only = onlyFlag >= 0 ? argv[onlyFlag + 1].split(',') : null;

const TOKEN = process.env.REPLICATE_API_TOKEN;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(pathname, init) {
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
  if (!res.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    throw new Error(`${res.status} ${res.statusText}\n${detail}`);
  }
  return body;
}

async function generate(prompt, name) {
  const headers = { Prefer: 'wait=60' };
  const prediction = await api(`/models/${model}/predictions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ input: { prompt } }),
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
  return Buffer.from(await img.arrayBuffer());
}

async function main() {
  if (!TOKEN && !dry) {
    console.error('REPLICATE_API_TOKEN is not set.\n');
    console.error('  export REPLICATE_API_TOKEN=r8_...   (from replicate.com/account/api-tokens)');
    console.error('  Then run this again. --dry prints the prompts without sending.\n');
    process.exit(2);
  }

  const pack = loadPack(caseId);
  const portraits = pack.portraits || {};
  const keys = Object.keys(portraits).filter(k => !only || only.includes(k.replace(/^p_/, '')));

  console.log(`\n${caseId} · ${model} · ${keys.length} portrait${keys.length === 1 ? '' : 's'}\n`);

  let made = 0, skipped = 0;
  for (const key of keys) {
    const rec = portraits[key];
    const name = key.replace(/^p_/, '');
    const out = path.join(ROOT, 'assets', 'portraits', `${name}.jpg`);
    if (!dry && fs.existsSync(out) && !force) {
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
      const buf = await generate(prompt, name);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, buf);
      console.log(`  ok     ${name.padEnd(10)} ${Math.round(buf.length / 1024)} KB -> assets/portraits/${name}.jpg`);
      made++;
    } catch (e) {
      console.error(`  FAIL   ${name.padEnd(10)} ${e.message.split('\n')[0]}`);
      console.error(e.message.includes('422')
        ? '         The model rejected the input. Its schema probably wants more than `prompt`;\n'
          + '         open replicate.com/' + model + '/api and check the field names.'
        : '');
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
