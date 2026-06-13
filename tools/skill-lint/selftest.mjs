#!/usr/bin/env node
/**
 * selftest.mjs — proves the vendored oracle behaves like the platform's Gate A
 * test (inlineArtifact.gateA.test.ts), with NO model and NO secrets. Run in CI
 * before linting skills so a broken runner fails fast and obviously.
 *
 *   - the known-good finops sankey transpiles clean + passes the validator
 *   - a USED disallowed import (d3) is rejected at transpile
 *   - the validator rejects the disallowed import at source level
 *   - a hardcoded domain accent (#4ade80, the #1187 drift) is rejected
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transpileInlineReact } from './transpile.mjs';
import { validateInlineArtifact } from './validator.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const SANKEY = join(REPO, 'skills', 'inline-artifact-author', 'examples', 'finops-sankey.tsx');

let failures = 0;
const ok = (name, cond) => {
  process.stdout.write(`${cond ? 'ok  ' : 'FAIL'} ${name}\n`);
  if (!cond) failures++;
};

const src = readFileSync(SANKEY, 'utf8');

// (i) good example transpiles clean
{
  const t = await transpileInlineReact(src);
  ok('finops sankey transpiles clean', t.error === null && !!t.js);
  ok('bundle resolves react→UMD global', !!t.js && t.js.includes('window.React'));
  ok('bundle exposes default export', !!t.js && t.js.includes('__cmArtifact'));
}

// (ii) good example passes validator
{
  const v = validateInlineArtifact(src, { expectViewBox: '0 0 800 380' });
  ok('finops sankey passes validator', v.pass && v.violations.length === 0);
}

// (iii) used d3 import rejected at transpile
{
  const bad =
    "import * as d3 from 'd3';\nexport default function A(){ const s = d3.scaleLinear(); return s ? null : null; }";
  const t = await transpileInlineReact(bad);
  ok('used d3 import rejected at transpile', t.error !== null && t.js === null);
}

// (iv) validator rejects disallowed import at source level
{
  const bad = "import * as d3 from 'd3'; export default function A(){ return null; }";
  const v = validateInlineArtifact(bad);
  ok('validator rejects d3 at source', !v.pass && v.violations.some((x) => x.rule === 'import-cage'));
}

// (v) hardcoded domain accent (#1187 drift) rejected
{
  const drifted = src.replace(/var\(--cm-accent\)/g, '#4ade80');
  const v = validateInlineArtifact(drifted, { expectViewBox: '0 0 800 380' });
  ok(
    'hardcoded accent (#4ade80) rejected',
    !v.pass && v.violations.some((x) => x.rule === 'live-accent' || x.rule === 'off-palette-hex'),
  );
}

process.stdout.write(`\n${failures === 0 ? 'SELFTEST PASS' : `SELFTEST FAILED (${failures})`}\n`);
process.exit(failures === 0 ? 0 : 1);
