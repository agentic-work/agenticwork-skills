/**
 * validator.mjs — VENDORED, BYTE-FAITHFUL port of the platform's
 * inlineArtifactValidator.ts (services/agenticwork-ui/.../v2/inlineArtifactValidator.ts).
 *
 * This is the deterministic oracle. It MUST stay in lockstep with the upstream
 * validator so that "passes skill-lint" === "passes the live render gate". The
 * rules, the SEMANTIC_PALETTE, and the regexes are copied verbatim; the only
 * change is JS (no TS types). tools/skill-lint/sync-check.mjs fails CI if this
 * drifts from the committed upstream snapshot.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/** Bare specifiers an inline-react artifact may import (mirrors the transpiler cage). */
export const ALLOWED_IMPORTS = new Set(['react', 'react-dom', 'react-dom/client', 'three']);

/**
 * The SMALL named semantic palette permitted as raw hex — the cloud-category +
 * state colors the end-state mocks actually use for chart data marks. Anything
 * outside this set must resolve via var(--cm-*). Lowercased for comparison.
 */
export const SEMANTIC_PALETTE = new Set([
  // cloud category
  '#f59e0b', // aws / warn
  '#38bdf8', // azure / info
  '#a78bfa', // gcp / k8s
  '#fcd34d', // service node
  // state
  '#22c55e', // ok
  '#ef4444', // err / spend target
  // neutral text used inside SVG marks
  '#f8fafc',
]);

const IMPORT_RE = /import\s+(?:[\w*\s{},]+\s+from\s+)?['"]([^'"]+)['"]/g;
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

/**
 * @param {string} source
 * @param {{ expectViewBox?: string, requireLiveAccent?: boolean }} [opts]
 * @returns {{ pass: boolean, violations: Array<{rule:string,detail:string}> }}
 */
export function validateInlineArtifact(source, opts = {}) {
  const violations = [];
  const { expectViewBox, requireLiveAccent = true } = opts;

  // 1. exactly one default-exported component
  if (!/export\s+default\b/.test(source)) {
    violations.push({ rule: 'default-export', detail: 'no `export default` component found' });
  }

  // 2. imports caged to the allowlist (mirrors inlineReactTranspiler)
  for (const m of source.matchAll(IMPORT_RE)) {
    const spec = m[1];
    if (!ALLOWED_IMPORTS.has(spec)) {
      violations.push({
        rule: 'import-cage',
        detail: `disallowed import "${spec}" — only ${[...ALLOWED_IMPORTS].join(', ')} resolve in the sandbox`,
      });
    }
  }

  // 3. inherits the LIVE accent — never a hardcoded domain accent (#1187 class)
  if (requireLiveAccent && !source.includes('var(--cm-accent')) {
    violations.push({
      rule: 'live-accent',
      detail:
        'must reference var(--cm-accent) so it inherits the user theme — do not bake a domain accent literal',
    });
  }

  // 4. no off-palette ad-hoc hex — theme drift. Permit the named semantic palette only.
  const hexes = source.match(HEX_RE) || [];
  const offPalette = [...new Set(hexes.map((h) => h.toLowerCase()))].filter(
    (h) => !SEMANTIC_PALETTE.has(h),
  );
  for (const h of offPalette) {
    violations.push({
      rule: 'off-palette-hex',
      detail: `off-palette hex ${h} — resolve via var(--cm-*) or use the named semantic palette`,
    });
  }

  // 5. chart sizing lock — viewBox must match the declared dimensions
  if (expectViewBox && !source.includes(`viewBox="${expectViewBox}"`)) {
    violations.push({
      rule: 'viewbox-sizing',
      detail: `expected viewBox="${expectViewBox}" (sizing lock) — not found`,
    });
  }

  return { pass: violations.length === 0, violations };
}
