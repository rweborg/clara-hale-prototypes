#!/usr/bin/env node
'use strict';
/**
 * _build/check.js — the one command that gates a change.
 *
 *   node _build/check.js                 # every case, then the full browser suite
 *   node _build/check.js clara-hale      # one case's contract, then the suite
 *   BASE_URL=… node _build/check.js      # point the browser suite somewhere else
 *
 * There is no assemble step: journey/index.html is a shell that loads
 * app/brand.js, one case pack, and app/player.js as real files, so there is
 * nothing to build. This runs the two things that can actually catch a
 * mistake — the contract check (fast, no browser) and the real experience
 * (headless Chromium).
 *
 * Exit code is non-zero if either fails.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
// Only treat the argument as a case id if that case actually exists, so a
// stray shell token (a pasted "#" comment, say) cannot derail the run.
const candidate = process.argv.slice(2).find(a => !a.startsWith('-'));
const caseArg = candidate && fs.existsSync(path.join(ROOT, 'cases', candidate, 'case.js')) ? candidate : null;
if (candidate && !caseArg) console.log(`\n  (ignoring "${candidate}" — not a case in cases/)`);

function run(label, script, args = []) {
  process.stdout.write(`\n\x1b[1m${label}\x1b[0m\n`);
  const r = spawnSync(process.execPath, [path.join(ROOT, '_build', script), ...args], {
    stdio: 'inherit',
    cwd: ROOT,
    env: process.env,
  });
  return r.status === 0;
}

const okLint = run('design system', 'lint.js', []);
if (!okLint) {
  console.error('\n\x1b[31mdesign-system lint failed — stopping before the browser run\x1b[0m\n');
  process.exit(1);
}

const okValidate = run('contract', 'validate.js', caseArg ? [caseArg] : []);
if (!okValidate) {
  console.error('\n\x1b[31mcontract failed — stopping before the browser run\x1b[0m\n');
  process.exit(1);
}

const okSmoke = run('experience', 'smoke.js', []);
if (!okSmoke) {
  console.error('\n\x1b[31mthe experience suite failed\x1b[0m\n');
  process.exit(1);
}

const okPlay = run('playthrough', 'playthrough.js', []);
if (!okPlay) {
  console.error('\n\x1b[31mthe case could not be played end to end\x1b[0m\n');
  process.exit(1);
}

console.log('\n\x1b[32mcheck passed\x1b[0m\n');
