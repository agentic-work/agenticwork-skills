#!/usr/bin/env node
/**
 * sync-check.mjs — drift guard. The vendored validator/transpile cage MUST stay
 * byte-faithful to the platform oracle, or "green in lint" stops meaning "green
 * in render". This checks the two invariants that actually matter to fidelity:
 *
 *   - the import allowlist (cage) matches { react, react-dom, react-dom/client, three }
 *   - the SEMANTIC_PALETTE matches the locked named-hex set
 *
 * If the upstream platform changes either, bump these expected sets in the same
 * PR that re-vendors validator.mjs/transpile.mjs. CI runs this so a silent drift
 * fails loudly instead of letting a lint pass that a render would reject.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { ALLOWED_IMPORTS, SEMANTIC_PALETTE } from './validator.mjs';
import { INLINE_REACT_IMPORT_ALLOWLIST } from './transpile.mjs';

const EXPECT_CAGE = ['react', 'react-dom', 'react-dom/client', 'three'];
const EXPECT_PALETTE = ['#f59e0b', '#38bdf8', '#a78bfa', '#fcd34d', '#22c55e', '#ef4444', '#f8fafc'];

const errs = [];
const eq = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

if (!eq([...ALLOWED_IMPORTS], EXPECT_CAGE)) {
  errs.push(`validator ALLOWED_IMPORTS drift: ${[...ALLOWED_IMPORTS].join(',')} != ${EXPECT_CAGE.join(',')}`);
}
if (!eq(Object.keys(INLINE_REACT_IMPORT_ALLOWLIST), EXPECT_CAGE)) {
  errs.push(`transpile cage drift: ${Object.keys(INLINE_REACT_IMPORT_ALLOWLIST).join(',')} != ${EXPECT_CAGE.join(',')}`);
}
if (!eq([...SEMANTIC_PALETTE], EXPECT_PALETTE)) {
  errs.push(`SEMANTIC_PALETTE drift: ${[...SEMANTIC_PALETTE].join(',')} != ${EXPECT_PALETTE.join(',')}`);
}

if (errs.length) {
  process.stderr.write('sync-check FAILED — vendored oracle drifted from the platform contract:\n');
  for (const e of errs) process.stderr.write(`  - ${e}\n`);
  process.exit(1);
}
process.stdout.write('sync-check PASS — vendored cage + palette match the platform oracle.\n');
