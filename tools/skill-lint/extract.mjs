/**
 * extract.mjs — pull the single authored component source out of a model
 * response. The skill teaches the model to emit ONE default-exported React
 * component via render_artifact kind:"react"; the eval harness accepts either a
 * raw tool-call argument (`content`) or a fenced ```tsx / ```jsx / ```react code
 * block, and returns the inner source for the SAME transpile + validator gate the
 * live render path uses.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const FENCE_RE = /```(?:tsx|jsx|ts|js|react)?\s*\n([\s\S]*?)```/g;

/**
 * @param {string} text  raw model response (assistant text or tool-call json)
 * @returns {string|null} the authored component source, or null if none found
 */
export function extractComponentSource(text) {
  if (!text) return null;

  // 1. render_artifact tool call shape: {"name":"render_artifact","arguments":{"kind":"react","content":"..."}}
  //    Be liberal: any JSON object in the text carrying a `content` string with an export-default.
  const jsonCandidates = text.match(/\{[\s\S]*\}/g) || [];
  for (const cand of jsonCandidates) {
    try {
      const obj = JSON.parse(cand);
      const content = findContent(obj);
      if (content && /export\s+default\b/.test(content)) return content;
    } catch {
      /* not valid json, fall through */
    }
  }

  // 2. fenced code blocks — prefer the LAST one that has a default export.
  let chosen = null;
  for (const m of text.matchAll(FENCE_RE)) {
    const body = m[1];
    if (/export\s+default\b/.test(body)) chosen = body;
  }
  if (chosen) return chosen.trim();

  // 3. last resort: the whole text if it itself looks like a component.
  if (/export\s+default\b/.test(text) && /import\s|=>|function\s/.test(text)) return text.trim();

  return null;
}

/** Recursively look for a `content` (or `source`/`code`) string field. */
function findContent(obj) {
  if (obj == null || typeof obj !== 'object') return null;
  for (const key of ['content', 'source', 'code']) {
    if (typeof obj[key] === 'string') return obj[key];
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = findContent(v);
      if (found) return found;
    }
  }
  return null;
}
