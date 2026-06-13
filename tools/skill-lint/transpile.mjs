/**
 * transpile.mjs — VENDORED, BYTE-FAITHFUL port of the platform's
 * inlineReactTranspiler.ts cage (cdnGlobalsPlugin + the esbuild build options).
 *
 * "Transpiles clean" in skill-lint MUST mean exactly what it means in the live
 * render path: same import allowlist, same loader:'tsx', same classic JSX
 * transform, same iife/bundle. If this drifts, a PR can pass lint and still fail
 * to render. sync-check.mjs guards the drift.
 *
 * Uses the node `esbuild` package (same build API as the browser `esbuild-wasm`).
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import * as esbuild from 'esbuild';

/** Bare specifiers the model may import; everything else is rejected. (Mirrors INLINE_REACT_IMPORT_ALLOWLIST.) */
export const INLINE_REACT_IMPORT_ALLOWLIST = {
  react: 'window.React',
  'react-dom': 'window.ReactDOM',
  'react-dom/client': 'window.ReactDOM',
  three: 'window.THREE',
};

const ARTIFACT_GLOBAL = '__cmArtifact';

/** esbuild plugin that resolves allowlisted bare specifiers to UMD globals and rejects everything else. */
function cdnGlobalsPlugin(usesThreeRef) {
  const NS = 'cm-cdn-global';
  return {
    name: 'cm-cdn-globals',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') return undefined;
        if (Object.prototype.hasOwnProperty.call(INLINE_REACT_IMPORT_ALLOWLIST, args.path)) {
          if (args.path === 'three') usesThreeRef.value = true;
          return { path: args.path, namespace: NS };
        }
        return {
          errors: [
            {
              text:
                `import "${args.path}" is not available in inline-react artifacts. ` +
                `Allowed: react, react-dom, react-dom/client, three.`,
            },
          ],
        };
      });
      build.onLoad({ filter: /.*/, namespace: NS }, (args) => {
        const g = INLINE_REACT_IMPORT_ALLOWLIST[args.path];
        return { contents: `module.exports = ${g};`, loader: 'js' };
      });
    },
  };
}

/**
 * Transpile + bundle the model-authored JSX/TSX into a self-contained IIFE,
 * exactly as the live parent transpiler does.
 *
 * @param {string} source
 * @returns {Promise<{ js: string|null, usesThree: boolean, error: string|null }>}
 */
export async function transpileInlineReact(source) {
  if (!source || !source.trim()) {
    return { js: null, usesThree: false, error: 'empty component source' };
  }
  const usesThreeRef = { value: false };
  try {
    const result = await esbuild.build({
      stdin: { contents: source, loader: 'tsx', resolveDir: '/', sourcefile: 'artifact.tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      globalName: ARTIFACT_GLOBAL,
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      target: 'es2020',
      minify: false,
      plugins: [cdnGlobalsPlugin(usesThreeRef)],
      logLevel: 'silent',
    });
    if (result.errors && result.errors.length > 0) {
      return { js: null, usesThree: usesThreeRef.value, error: result.errors.map((e) => e.text).join('; ') };
    }
    const js = result.outputFiles?.[0]?.text ?? null;
    if (!js) return { js: null, usesThree: usesThreeRef.value, error: 'esbuild produced no output' };
    return { js, usesThree: usesThreeRef.value, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { js: null, usesThree: usesThreeRef.value, error: msg };
  }
}
