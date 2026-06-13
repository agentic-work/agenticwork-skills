#!/usr/bin/env node
/**
 * skill-lint — the "linter for LLMs" runner for agenticwork-skills.
 *
 * TWO LAYERS, ONE oracle (transpile cage + inlineArtifactValidator, vendored
 * byte-faithful from the platform so green-here === green-in-render):
 *
 *   --mode static   (default; no model, no secrets; every PR)
 *     For each skills/<name>/SKILL.md:
 *       1. frontmatter parses + validates against schema/skill.frontmatter.schema.json
 *       2. `name` matches the directory; required body sections present
 *       3. frontmatter.imports ⊆ the live transpiler cage
 *       4. every declared examples/*.tsx exists, transpiles CLEAN through the
 *          SAME esbuild cage, and PASSES validateInlineArtifact (with the
 *          example's <file>.meta.json expectViewBox/requireLiveAccent if present)
 *
 *   --mode behavioral   (gated; reads a model endpoint from repo secrets)
 *     For each eval task: feed the skill body + the task to a capable model
 *     `runsPerTask` times; extract the authored component; gate it through the
 *     SAME transpile + validator; require the pass-rate to clear
 *     `passRateThreshold`. This is the real LLM linter — it proves the skill
 *     actually makes a model author conformant output, not just that the
 *     hand-written examples are clean.
 *
 * Exit 0 = pass, 1 = lint/eval failure, 2 = harness/usage error.
 *
 * Usage:
 *   node tools/skill-lint/skill-lint.mjs [--mode static|behavioral] [--skill <name>] [--json]
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import Ajv from 'ajv';

import { transpileInlineReact } from './transpile.mjs';
import { validateInlineArtifact, ALLOWED_IMPORTS } from './validator.mjs';
import { extractComponentSource } from './extract.mjs';
import { modelConfigFromEnv, chatComplete } from './modelClient.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const SKILLS_DIR = join(REPO_ROOT, 'skills');
const SCHEMA_PATH = join(REPO_ROOT, 'schema', 'skill.frontmatter.schema.json');

/** Required H2 (## ) section headings every SKILL.md body must contain. */
const REQUIRED_SECTIONS = ['When to use', 'Constraints', 'Output contract', 'Example'];

// ----------------------------------------------------------------------------
// args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const a = { mode: 'static', skill: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--mode') a.mode = argv[++i];
    else if (v === '--skill') a.skill = argv[++i];
    else if (v === '--json') a.json = true;
    else if (v === '-h' || v === '--help') a.help = true;
  }
  return a;
}

// ----------------------------------------------------------------------------
// SKILL.md parsing
// ----------------------------------------------------------------------------
function splitFrontmatter(md) {
  // Strict: file must start with a `---\n ... \n---` block.
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(md);
  if (!m) return { frontmatter: null, body: md, error: 'no YAML frontmatter block at top of file' };
  let fm;
  try {
    fm = parseYaml(m[1]);
  } catch (e) {
    return { frontmatter: null, body: m[2], error: `frontmatter YAML parse error: ${e.message}` };
  }
  if (fm == null || typeof fm !== 'object') {
    return { frontmatter: null, body: m[2], error: 'frontmatter is not a mapping' };
  }
  return { frontmatter: fm, body: m[2], error: null };
}

function discoverSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .map((name) => ({ name, dir: join(SKILLS_DIR, name) }))
    .filter((s) => statSync(s.dir).isDirectory() && existsSync(join(s.dir, 'SKILL.md')));
}

// ----------------------------------------------------------------------------
// STATIC layer
// ----------------------------------------------------------------------------
function makeValidateFrontmatter() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

async function lintSkillStatic(skill, validateFrontmatter) {
  const errors = [];
  const mdPath = join(skill.dir, 'SKILL.md');
  const md = readFileSync(mdPath, 'utf8');
  const { frontmatter, body, error } = splitFrontmatter(md);

  if (error) {
    errors.push(error);
    return { skill: skill.name, ok: false, errors };
  }

  // 1. schema
  if (!validateFrontmatter(frontmatter)) {
    for (const e of validateFrontmatter.errors || []) {
      errors.push(`frontmatter ${e.instancePath || '/'} ${e.message}`);
    }
  }

  // 2. name === directory
  if (frontmatter.name !== skill.name) {
    errors.push(`frontmatter name "${frontmatter.name}" must equal directory "${skill.name}"`);
  }

  // 3. required body sections
  const headings = (body.match(/^##\s+(.+?)\s*$/gm) || []).map((h) => h.replace(/^##\s+/, '').trim());
  for (const need of REQUIRED_SECTIONS) {
    const hit = headings.some((h) => h.toLowerCase().includes(need.toLowerCase()));
    if (!hit) errors.push(`missing required body section: "## ${need}"`);
  }

  // 4. frontmatter.imports ⊆ live cage
  if (Array.isArray(frontmatter.imports)) {
    for (const spec of frontmatter.imports) {
      if (!ALLOWED_IMPORTS.has(spec)) {
        errors.push(`frontmatter imports lists "${spec}" which is not in the transpiler cage [${[...ALLOWED_IMPORTS].join(', ')}]`);
      }
    }
  }

  // 5. examples: exist + transpile clean + pass validator
  const examples = Array.isArray(frontmatter.examples) ? frontmatter.examples : [];
  if (frontmatter.renderPath === 'react-inline-artifact' && examples.length === 0) {
    errors.push('renderPath react-inline-artifact requires at least one worked example in frontmatter.examples');
  }
  for (const rel of examples) {
    const exPath = join(skill.dir, rel);
    if (!existsSync(exPath)) {
      errors.push(`example not found: ${rel}`);
      continue;
    }
    const src = readFileSync(exPath, 'utf8');
    const meta = readMeta(exPath);

    const t = await transpileInlineReact(src);
    if (t.error) {
      errors.push(`example ${rel} failed transpile cage: ${t.error}`);
    }
    const v = validateInlineArtifact(src, {
      expectViewBox: meta.expectViewBox,
      requireLiveAccent: meta.requireLiveAccent ?? frontmatter.themeTokens?.requireLiveAccent ?? true,
    });
    for (const viol of v.violations) {
      errors.push(`example ${rel} validator: [${viol.rule}] ${viol.detail}`);
    }
  }

  return { skill: skill.name, ok: errors.length === 0, errors };
}

function readMeta(exPath) {
  const metaPath = exPath.replace(/\.tsx$/, '.meta.json');
  if (!existsSync(metaPath)) return {};
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    return {};
  }
}

// ----------------------------------------------------------------------------
// BEHAVIORAL layer
// ----------------------------------------------------------------------------
const SYSTEM_PREAMBLE =
  'You are an expert front-end engineer using the AgenticWork inline-artifact author skill below. ' +
  'Follow the skill EXACTLY. Output ONLY the single default-exported React component source ' +
  '(one fenced ```tsx code block, nothing else). Do not explain.';

async function evalSkillBehavioral(skill, cfg) {
  const result = { skill: skill.name, ok: true, attempts: [], passRate: 1, threshold: 1 };
  const md = readFileSync(join(skill.dir, 'SKILL.md'), 'utf8');
  const { frontmatter, body } = splitFrontmatter(md);
  const evalCfg = frontmatter?.eval;
  if (!evalCfg || !Array.isArray(evalCfg.tasks) || evalCfg.tasks.length === 0) {
    // No eval block = nothing for the behavioral layer to do (not a failure).
    result.skipped = 'no eval.tasks in frontmatter';
    return result;
  }
  const runsPerTask = evalCfg.runsPerTask ?? 5;
  const threshold = evalCfg.passRateThreshold ?? 0.8;
  result.threshold = threshold;

  const system = `${SYSTEM_PREAMBLE}\n\n=== SKILL: ${frontmatter.name} ===\n${body}`;

  let pass = 0;
  let total = 0;
  for (const taskRel of evalCfg.tasks) {
    const taskPath = join(skill.dir, taskRel);
    if (!existsSync(taskPath)) {
      result.ok = false;
      result.attempts.push({ task: taskRel, run: 0, pass: false, reason: 'task file not found' });
      continue;
    }
    const task = readFileSync(taskPath, 'utf8');
    for (let run = 1; run <= runsPerTask; run++) {
      total++;
      let attempt = { task: taskRel, run, pass: false };
      try {
        const reply = await chatComplete(cfg, { system, user: task });
        const src = extractComponentSource(reply);
        if (!src) {
          attempt.reason = 'no authored component found in model output';
        } else {
          const t = await transpileInlineReact(src);
          const v = validateInlineArtifact(src, {
            requireLiveAccent: frontmatter.themeTokens?.requireLiveAccent ?? true,
          });
          if (t.error) attempt.reason = `transpile: ${t.error}`;
          else if (!v.pass) attempt.reason = `validator: ${v.violations.map((x) => x.rule).join(',')}`;
          else {
            attempt.pass = true;
            pass++;
          }
        }
      } catch (e) {
        attempt.reason = `model call: ${e.message}`;
      }
      result.attempts.push(attempt);
    }
  }
  result.passRate = total === 0 ? 0 : pass / total;
  result.ok = result.passRate >= threshold;
  return result;
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
function printHelp() {
  process.stdout.write(
    'skill-lint — linter for LLM skills\n\n' +
      'Usage: node tools/skill-lint/skill-lint.mjs [--mode static|behavioral] [--skill <name>] [--json]\n\n' +
      '  --mode static      (default) frontmatter + sections + example transpile/validate. No secrets.\n' +
      '  --mode behavioral  model authors components; gated by the same transpile+validator. Needs MODEL_API_BASE/MODEL_ID.\n' +
      '  --skill <name>     lint only one skill directory.\n' +
      '  --json             machine-readable output.\n',
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }
  if (!['static', 'behavioral'].includes(args.mode)) {
    process.stderr.write(`unknown --mode ${args.mode}\n`);
    return 2;
  }

  let skills = discoverSkills();
  if (args.skill) skills = skills.filter((s) => s.name === args.skill);
  if (skills.length === 0) {
    process.stderr.write(`no skills found under ${SKILLS_DIR}${args.skill ? ` matching "${args.skill}"` : ''}\n`);
    // An empty skill set is not a failure for static (fresh repo); it IS for an explicit --skill miss.
    return args.skill ? 1 : 0;
  }

  const results = [];
  if (args.mode === 'static') {
    const validateFrontmatter = makeValidateFrontmatter();
    for (const s of skills) results.push(await lintSkillStatic(s, validateFrontmatter));
  } else {
    let cfg;
    try {
      cfg = modelConfigFromEnv();
    } catch (e) {
      process.stderr.write(`${e.message}\n`);
      return 2;
    }
    for (const s of skills) results.push(await evalSkillBehavioral(s, cfg));
  }

  const failed = results.filter((r) => !r.ok);
  if (args.json) {
    process.stdout.write(JSON.stringify({ mode: args.mode, results }, null, 2) + '\n');
  } else {
    for (const r of results) {
      if (args.mode === 'static') {
        process.stdout.write(`${r.ok ? 'PASS' : 'FAIL'}  ${r.skill}\n`);
        for (const e of r.errors || []) process.stdout.write(`        - ${e}\n`);
      } else {
        const rate = (r.passRate * 100).toFixed(0);
        const thr = (r.threshold * 100).toFixed(0);
        const tag = r.skipped ? `SKIP (${r.skipped})` : `${r.ok ? 'PASS' : 'FAIL'} pass-rate ${rate}% (need ${thr}%)`;
        process.stdout.write(`${tag}  ${r.skill}\n`);
        for (const a of r.attempts.filter((x) => !x.pass)) {
          process.stdout.write(`        - ${a.task} run ${a.run}: ${a.reason}\n`);
        }
      }
    }
  }
  process.stdout.write(`\n${results.length - failed.length}/${results.length} skills passed (${args.mode}).\n`);
  return failed.length === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    process.stderr.write(`skill-lint crashed: ${e?.stack || e}\n`);
    process.exit(2);
  });
