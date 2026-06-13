---
name: skill-creator
description: >-
  Use when authoring, editing, or reviewing a SKILL.md for the agenticwork-skills
  repo (skills/<name>/SKILL.md). Teaches the house format — tight frontmatter (name
  + when-to-use description), progressive disclosure (only name/description stay
  resident; body and reference/ load on demand), worked-example floor, and the
  quality bar (curated pinned deps, no secrets, no model literals). For artifact
  skills, encodes the non-negotiable: the output must pass the behavioral eval
  (inlineArtifactValidator) — theme tokens, import cage, default export, sizing lock.
tags: [meta, authoring, skills, progressive-disclosure, quality]
version: 1.0.0
---

# skill-creator

Author a `SKILL.md` that makes a capable model reproduce expert output **faithfully
and consistently** — not as a lucky one-off. This is the meta-skill: read it before
adding or editing any skill in this repo.

> RULE #1 of this repo: **understanding over motion.** You cannot write a skill until
> you can explain the whole path — what it teaches, how the runtime loads it, and what
> "correct output" actually *renders as*. Derive "correct" from the verified-real
> behavior (the validator, the rendered artifact), never from a guess.

## The shape (non-negotiable)

```
skills/
  <skill-name>/
    SKILL.md          # YAML frontmatter (name, description) + Markdown body
    resources/        # optional reference material, loaded ON DEMAND
    scripts/          # optional helper scripts the skill may invoke
```

- **One skill per directory.** Directory name == frontmatter `name` (kebab-case).
- **`SKILL.md` is the only required file.** `resources/` and `scripts/` are optional.

## Progressive disclosure — the whole point

A skill is loaded in two stages. Author for both:

1. **Resident (always in context, cheap):** only `name` + `description`. The model
   reads these to decide *whether* to open the skill. Make the **description** about
   **WHEN to use** — the trigger situation — not how. One or two sentences.
2. **On demand (loaded only when opened):** the Markdown **body** and anything under
   `resources/`. Push all the "how" — constraints, contracts, worked examples,
   edge cases, long reference tables — here. The model only pays for it when the task
   actually calls for the skill. There is no separate router; the model decides
   in-context.

**Frontmatter (minimum):**

```yaml
---
name: inline-artifact-design
description: >-
  Use when a user asks for a rich inline/interactive visualization, dashboard, or
  scene rendered in the chat. Teaches how to author a single default-exported React
  component, using only the curated pinned libraries, that renders at production
  fidelity in the sandboxed artifact iframe.
---
```

Good `description` = a **when-to-use trigger** a model can match against a request.
Bad `description` = a feature list, a "how it works" essay, or marketing copy.

## The consistency contract (what makes a skill GOOD, not just present)

A skill that produces expert output *sometimes* is a failed skill. Pin the constraints
so a capable model lands the target quality **every time**:

1. **State the constraints explicitly** — allowed libraries, the output contract
   (e.g. "exactly one default-exported component"), theme tokens, and an explicit
   **DO NOT** list. Ambiguity is where consistency dies.
2. **Curated, pinned dependencies only.** Runtimes resolve imports against a fixed
   allowlist — an un-pinned dependency simply will not load. Never say "install what
   you need." Name the exact allowed set.
3. **Ship verified exemplars as the few-shot floor.** Include at least one **worked
   example** the model can pattern-match against, and prove it passes the skill's
   oracle before you commit. Never zero proof.
4. **No model/provider literals.** Skills describe capability and intent. Routing to
   a capable-enough model is the platform's job (resolved via provider capabilities),
   never a pinned model name/tag in a `SKILL.md`.
5. **No secrets, no credentials, no customer data.** This repo is **public** — every
   diff is read by a customer and an auditor.

## Artifact skills — the output MUST pass the behavioral eval

Any skill whose output is a rendered inline artifact (chart / dashboard / scene as a
React component) is held to a **deterministic oracle**: `validateInlineArtifact`
(`inlineArtifactValidator.ts`). "It transpiled" is NOT done — that only catches
syntax/imports. The validator is the other half of the gate, and the skill must
teach the model to satisfy every rule:

| Rule | What the skill must teach | Why |
|---|---|---|
| `default-export` | Author exactly **one `export default`** component | The mount harness mounts the default export |
| `import-cage` | Import **only** `react`, `react-dom`, `react-dom/client`, `three` | The sandbox resolver rejects anything else — it won't load |
| `live-accent` | The accent MUST resolve via **`var(--cm-accent)`** | So it inherits the LIVE user theme; baking a domain accent literal is the #1187 drift bug |
| `off-palette-hex` | Resolve all colors via **`var(--cm-*)`**; raw hex ONLY for the small named semantic data palette | Off-palette hex fights the global theme |
| `viewbox-sizing` | The SVG `viewBox` must match the declared chart dimensions | Sizing lock — prevents layout drift |

**Named semantic palette** (the ONLY raw hex permitted, for chart data marks):
`#f59e0b` (aws/warn), `#38bdf8` (azure/info), `#a78bfa` (gcp/k8s), `#fcd34d`
(service), `#22c55e` (ok), `#ef4444` (err/target), `#f8fafc` (in-SVG text).
Everything else → `var(--cm-*)`.

**Interleave, not scripts.** The platform owns the chronological interleave, chrome,
and theme. An artifact skill teaches the model to author a **focused, theme-inheriting
component (just the viz)** — never to reproduce the whole transcript or re-implement
chrome. Assume the output runs in a hardened, opaque-origin, pinned-import,
no-ambient-credential sandbox; never instruct a model to weaken it.

## Copy-paste exemplar (passes the validator)

The few-shot floor for an artifact skill is a single default-exported component:
caged to `react`, accent via `var(--cm-accent)`, surface/text via `var(--cm-*)`,
data marks from the named palette, locked `viewBox`. See
`examples/finops-sankey.jsx` and `examples/service-health-donut.jsx` in this skill —
both pass `validateInlineArtifact` with zero violations.

```jsx
import React from 'react';
export default function MiniBar() {
  const rows = [
    { id: 'aws', label: 'AWS', v: 62, color: '#f59e0b' },
    { id: 'azure', label: 'Azure', v: 41, color: '#38bdf8' },
  ];
  return (
    <div style={{ fontFamily: 'var(--cm-font-ui, system-ui, sans-serif)', color: 'var(--cm-fg-1)' }}>
      <div style={{ fontWeight: 600, borderLeft: '3px solid var(--cm-accent)', paddingLeft: 10 }}>Spend</div>
      <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" style={{ width: '100%' }}>
        {rows.map((r, i) => (
          <rect key={r.id} x="60" y={20 + i * 40} width={r.v * 2} height="22" rx="4" fill={r.color} />
        ))}
      </svg>
    </div>
  );
}
```

## Quality gate — before you commit (RED → GREEN)

1. **FACTUAL** — the file exists at `skills/<name>/SKILL.md`, frontmatter parses,
   `name` matches the directory, `description` says *when to use*.
2. **PROGRAMMATIC** — every worked example passes the skill's oracle via the correct
   runner. For artifact skills: `validateInlineArtifact(source, { expectViewBox })`
   returns `{ pass: true, violations: [] }` AND it transpiles clean through the
   real transpiler with imports caged. RED→GREEN observed, not assumed.
3. **LIVE** — for user-facing output, a capable model authors *from the skill* and the
   rendered result is read live before any "works/done" claim. Mocks and greps are
   hypotheses; the rendered truth is the verdict.

See `resources/quality-checklist.md` for the full pre-commit checklist.

## Anti-patterns (auto-reject in review)

- A `description` that explains *how* instead of *when* — it bloats the resident budget.
- "Install whatever library you need" / any un-pinned dependency.
- A hardcoded model id/tag/deployment anywhere in the skill.
- Zero worked examples, or an example that was never run against the oracle.
- An artifact example with off-palette hex, a baked domain accent, a disallowed
  import, no default export, or a `viewBox` that doesn't match the declared size.
- Any secret, credential, internal hostname, or customer data (this repo is public).
- Instructing the model to weaken the sandbox (request ambient creds, unpin imports,
  widen connect-src).
