# Chart construction — hand-authored SVG (no charting runtime)

Charts are pure SVG: `<svg>` with `<rect>`, `<path>`, `<line>`, `<circle>`,
`<text>`, `<linearGradient>`. You may **not** import a charting library (the cage
rejects every import except react/react-dom/three). You do not need one — the
mocks are all hand-built SVG, and a `.map()` over typed data gets you there.

## Locked viewBox per chart type (sizing lock — must appear literally)

| Chart | viewBox | Notes |
|---|---|---|
| sankey | `0 0 800 380` | 3 columns: source (x≈20–40) → service (x≈370–384) → bucket (x≈700–720) |
| latency heatmap | `0 0 760 130` | grid of `<rect>` cells, opacity ∝ value |
| line (latency / GPU util) | `0 0 740 140` | polyline/path over a faint baseline |
| dependency graph | `0 0 760 360` | `<circle>` nodes + `<line>`/`<path>` edges |

Always pair with `preserveAspectRatio="xMidYMid meet"` and a responsive wrapper
`style={{ width: "100%", height: "auto" }}` so the chart scales to the slide-out
without distorting. The literal `viewBox="0 0 800 380"` (etc.) must be present —
the validator greps for it.

## Color rule inside SVG

- **Data marks** (the bars, ribbons, cells, lines that ENCODE a category/value):
  the named semantic palette hex (`#f59e0b` aws, `#38bdf8` azure, `#a78bfa` gcp,
  `#fcd34d` service, `#ef4444` target, `#22c55e` ok).
- **Everything else in the SVG** (axis labels, legends, tick text, gridlines,
  captions): `fill="var(--cm-fg-3)"` / `stroke="var(--cm-line-2)"` etc. SVG
  attributes accept `var(--cm-*)` directly.

Example text label: `<text fill="var(--cm-fg-3)" fontFamily="var(--cm-font-mono, monospace)" fontSize="10">axis</text>`.

## Sankey method (the worked pattern)

1. Three node columns. Each node is a `<rect>` whose **height ∝ its magnitude**.
   Left = sources (cloud), middle = items (service spikes), right = buckets. Fill
   with the named palette by category.
2. **Ribbons** are cubic-bezier `<path>` filled with a `<linearGradient>` that
   blends the source color → the target color, e.g.:
   ```tsx
   <linearGradient id="ga" x1="0" x2="1">
     <stop offset="0" stopColor="#f59e0b" stopOpacity="0.55" />
     <stop offset="1" stopColor="#ef4444" stopOpacity="0.30" />
   </linearGradient>
   ```
   Ribbon path shape (top edge bezier across, drop down by the band height, bezier
   back, close): `M x0 yTop C cx1 yTop, cx2 yTop2, x1 yTop2 L x1 yBot2 C cx2 yBot2, cx1 yBot, x0 yBot Z`.
   Paint ribbons **before** the node rects so nodes sit on top.
3. Labels: node name in `var(--cm-fg-0/1)`, the sub-figure in mono
   `var(--cm-fg-3)` or mark-text `#f8fafc` when it sits over a colored ribbon.
4. Column legends along the bottom in `var(--cm-fg-3)` mono 10px.

The full, validator-passing sankey is `examples/FinopsSankey.tsx`. Copy its
gradient defs, ribbon path formula, and label treatment.

## Heatmap method

A grid of `<rect width=h height=h>`; map value → opacity of a single named-palette
fill (e.g. `#ef4444` at `fillOpacity={v/max}`) so hotter cells read darker. Row
/column labels in `var(--cm-fg-3)` mono. Keep cells on a fixed pitch so the grid
stays square; lock `viewBox="0 0 760 130"`.

## Line method

Baseline `<line>` in `var(--cm-line-2)`; the series as a single `<polyline>` /
`<path>` `stroke="var(--cm-accent)"` (or a named-palette color when the series is
a fixed category) `fill="none" strokeWidth="2"`. Optional area = the same path
closed to the baseline with a low-opacity `var(--cm-accent-soft)` fill. Sparse
tick labels in `var(--cm-fg-3)` mono. Lock `viewBox="0 0 740 140"`.

## Why no D3/canvas

The iframe is pure-render with a tight CSP and a 4-import cage; a runtime charting
lib can't load and isn't needed. Hand-SVG is deterministic, themeable (labels via
tokens), and matches the mock pixel-for-pixel. It also keeps the bundle tiny.
