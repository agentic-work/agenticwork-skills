---
name: inline-artifact-author
description: >-
  Use when the user asks for a rich inline visual rendered in the chat — a chart
  (sankey, heatmap, latency/GPU line, dependency graph), a dashboard or status
  card (KPI strip, savings grid, incident/runbook/permission/compliance card),
  or a data table. Teaches how to author ONE focused, theme-adaptive,
  default-exported React component (`render_artifact` kind:"react") that renders
  at mock fidelity in the sandboxed artifact iframe — hand-built SVG charts (no
  charting runtime), every color resolved through the live theme tokens, and a
  locked viewBox — so the output is faithful and consistent, not a lucky one-off.
tags: [artifacts, react, svg, dataviz, dashboard, theme, chatmode, inline-jsx]
version: 1.0.0
---

# Inline Artifact Author

Author **one** focused React component that renders a chart, dashboard, card, or
table **inline in the chat**, at the fidelity of the platform's hand-designed
mocks. The platform owns the chrome (slide-out, interleave, theme injection); you
own a single, well-composed component.

## The render path (know it before you author)

1. You emit `render_artifact` with `kind:"react"` and the **raw component source**
   (`.jsx`/`.tsx`) in `content`. One default-exported component. Nothing else.
2. The **UI parent** transpiles it with esbuild-wasm (classic JSX transform) and
   bundles it to a self-contained IIFE. **There is no Babel in the iframe and no
   `eval`** — your source is compiled before it ever reaches the sandbox.
3. The bundle mounts in a **sandboxed iframe** whose CSP is `connect-src 'none'`.
   This is **pure render**: no `fetch`, no network, no exec → **no HITL prompt**.
4. The host injects the **live `--cm-*` theme variables** into the iframe, so a
   component that reads those tokens automatically tracks the user's theme and
   accent (light/dark + custom accent), with zero extra work from you.

Because it is pure render, you cannot fetch or compute against live systems —
**bake the data you were given (or the user supplied) straight into the
component as constants.** If a task genuinely needs to call out or execute, that
is a different (Class B) path — do not try to do it here.

## The cage (hard limits — violating any one fails the build or the validator)

These are enforced deterministically. They are not style suggestions.

- **Exactly one `export default` component.** The mount harness renders the
  default export; no default = blank iframe.
- **Imports are allowlisted to `react`, `react-dom`, `react-dom/client`, `three`
  — nothing else.** No `axios`, no `d3`, no `@react-three/fiber`, no charting
  library, no node builtins. Any other import is a hard build error. (3D scenes
  use `three` directly; this skill focuses on 2D charts/dashboards/tables.)
- **No charting/runtime dependency for charts.** Charts are **hand-authored SVG**
  (`<svg><path><rect><text>…`). You are not allowed to import a chart lib, and you
  do not need one — see `reference/chart-construction.md`.
- **Every color resolves through the theme.** The accent **must** be
  `var(--cm-accent)` — never a baked accent literal. All surfaces/text/lines use
  `var(--cm-*)`. The **only** raw hex permitted is the small **named semantic
  palette** for chart data marks (below). Any other hex = `off-palette-hex` fail.
- **Charts lock their `viewBox`** to the canonical size for that chart type
  (sankey `0 0 800 380`, latency heatmap `0 0 760 130`, line chart `0 0 740 140`).
  The literal `viewBox="0 0 800 380"` must appear in source.

### The consistency contract (this is what "faithful + consistent" means)

| Rule | Do | Never |
|---|---|---|
| Accent | `var(--cm-accent)` everywhere an accent is wanted | bake `#4ade80` or any domain accent |
| Surfaces/text/lines | `var(--cm-bg-1/2/3)`, `var(--cm-fg-0/1/2/3)`, `var(--cm-line-1/2)` | any off-palette hex, even as a `var()` fallback |
| Status | a semantic token **and** a text label | color alone |
| Chart marks | the named semantic palette only (below) | inventing chart colors |
| Numbers/IDs/timestamps | mono face + `fontVariantNumeric:"tabular-nums"` | proportional digits that wobble |
| Chart geometry | exact locked `viewBox` | an ad-hoc size |

### The named semantic palette (the ONLY raw hex you may write)

Use these **only** for chart data marks (SVG `fill`/`stop-color`), where a
category genuinely needs a fixed, recognizable color:

| Hex | Meaning |
|---|---|
| `#f59e0b` | AWS / warn |
| `#38bdf8` | Azure / info |
| `#a78bfa` | GCP / k8s |
| `#fcd34d` | service node |
| `#22c55e` | ok |
| `#ef4444` | err / spend target |
| `#f8fafc` | neutral text inside an SVG mark |

Everything that is *chrome* (the card frame, header, captions, axis labels, table
header, dividers) goes through `var(--cm-*)`, **not** these hexes.

### CRITICAL: no hex fallback inside `var()`

The validator scans for **any** hex outside the named palette — it does **not**
understand CSS `var()` fallback syntax. So `color: "var(--cm-fg-1, #d4d4d8)"`
**fails** (`#d4d4d8` is off-palette). The host always injects the `--cm-*`
tokens, so the fallback is dead weight anyway.

- ✅ `color: "var(--cm-fg-1)"`
- ❌ `color: "var(--cm-fg-1, #d4d4d8)"`  ← off-palette-hex violation
- ✅ `borderRadius: "var(--radius-md, 10px)"`  ← non-hex fallback is fine
- ✅ `fontFamily: "var(--cm-font-mono, 'JetBrains Mono', monospace)"`  ← fine

## The design language (mock fidelity at a glance)

Dark, technical, dense-but-calm. (You write only tokens; these are the values the
host injects, so you know what they look like.)

- **Surfaces** step `--cm-bg` → `--cm-bg-1` (cards) → `--cm-bg-2/3` (nested).
  **Text** steps `--cm-fg-0` (headings) → `--cm-fg-1` (body) → `--cm-fg-2/3`
  (muted/labels). **Hairlines** `--cm-line-1/2`.
- **Type:** Inter for UI/body (~13–14px); **JetBrains Mono** for every datum,
  ID, command, and timestamp, always with `tabular-nums`.
- **Cards** sit on `--cm-bg-1`, `1px solid var(--cm-line-1)`, radius 10px, with a
  **3px left border** that is `var(--cm-accent)` for a neutral card or a status
  token (`--cm-ok/--cm-warn/--cm-err`) for a status card. KPI tiles use a **3px
  top border** in the same scheme.
- **Labels** are 9.5–10px, UPPERCASE, `letter-spacing:0.08em`, `--cm-fg-3`.
- **Spacing** on a 4px grid; gaps 8–14px.

Full token list + the exact card/KPI/table recipes are in
`reference/design-tokens.md` and `reference/component-patterns.md`. The chart
geometry method is in `reference/chart-construction.md`. **Read the reference
file that matches what you're building** — don't guess sizes or token names.

## How to author (the loop)

1. **Decide the widget.** Chart (sankey / heatmap / line / dependency graph),
   dashboard/card (KPI strip, savings grid, incident/runbook/compliance/permission
   card), or table. Pick the matching pattern in `component-patterns.md`.
2. **Bake the data** as typed top-level `const` arrays (use the real numbers you
   were given). Drive the JSX by `.map()` over those — never copy-paste rows.
3. **Compose with tokens.** Style with inline `React.CSSProperties`. Chrome →
   `var(--cm-*)`. Status → token + text. Accent → `var(--cm-accent)`. For a chart,
   set the locked `viewBox` and use the named palette for marks only.
4. **One default export.** `export default function Widget() { … }`.
5. **Self-check against the cage** before you emit (next section).

## Self-check (run this checklist mentally — it mirrors the CI oracle)

- [ ] Exactly one `export default` component?
- [ ] Imports only from `react` / `react-dom` / `react-dom/client` / `three`?
- [ ] Does `var(--cm-accent)` appear (the accent is live, not baked)?
- [ ] Is **every** hex in source one of the 7 named-palette values, used only on
      an SVG mark? (No hex in any `var()` fallback. No chrome hex.)
- [ ] If it's a chart, is the canonical `viewBox` literal present?
- [ ] Status shown by **token + text**, not color alone?
- [ ] Numbers/IDs in mono + `tabular-nums`?

If any box is unchecked, fix it before emitting. These map 1:1 to the deterministic
validator (`inlineArtifactValidator`): `default-export`, `import-cage`,
`live-accent`, `off-palette-hex`, `viewbox-sizing`. The examples in `examples/`
pass it; the validator's negative cases prove it bites on a baked accent, an
off-palette hex, a stray import, and a wrong viewBox. **Treat the examples as the
floor, not the ceiling** — match their token discipline and geometry exactly, then
shape the content to the task.

## Copy-paste starting points

A neutral, token-correct card shell — start here, then fill it in:

```tsx
import React from "react";

export default function Widget() {
  const card: React.CSSProperties = {
    background: "var(--cm-bg-1)",
    border: "1px solid var(--cm-line-1)",
    borderLeft: "3px solid var(--cm-accent)", // status token for a status card
    borderRadius: "var(--radius-md, 10px)",
    padding: "14px",
    fontFamily: "var(--cm-font-ui, 'Inter', system-ui, sans-serif)",
    color: "var(--cm-fg-1)",
    fontSize: "13px",
  };
  const mono: React.CSSProperties = {
    fontFamily: "var(--cm-font-mono, 'JetBrains Mono', monospace)",
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cm-accent)" }} />
        <span style={{ color: "var(--cm-fg-0)", fontWeight: 600 }}>Title</span>
        <span style={{ ...mono, marginLeft: "auto", color: "var(--cm-fg-3)", fontSize: "11px" }}>caption</span>
      </div>
      {/* content */}
    </div>
  );
}
```

For a full SVG sankey, see `examples/FinopsSankey.tsx`; for a KPI strip + ranked
grid, see `examples/SavingsDashboard.tsx`. Both are real, transpilable, and pass
the validator — copy their structure.

## Common failures (and the fix)

- **Blank iframe** → no `export default`, or you imported something off the
  allowlist (the build error names the import). Remove it.
- **Card ignores the user's theme/accent** → you baked a hex (often a `var()`
  fallback or a literal accent). Replace with bare `var(--cm-*)` / `var(--cm-accent)`.
- **Chart looks squashed/cropped** → wrong or missing `viewBox`. Use the canonical
  size and `preserveAspectRatio="xMidYMid meet"`.
- **Numbers jitter between rows** → missing `tabular-nums` or not using the mono
  face on the figures.
- **You tried to `fetch`/compute live** → not allowed here (connect-src 'none').
  Bake the data, or use the executable path instead.
