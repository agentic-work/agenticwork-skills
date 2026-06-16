# Design tokens — the chatmode visual contract

The host injects these CSS custom properties into the artifact iframe at the live
values for the user's current theme (dark shown below; light flips the scale).
**Author against the token name, never the value** — that is what makes a
component theme-adaptive. The only place a literal value belongs in your source
is the named semantic palette for chart marks.

## Surfaces & lines

| Token | Dark value | Use |
|---|---|---|
| `--cm-bg` | `#09090b` | page base (rarely needed inside a card) |
| `--cm-bg-1` | `#0f1012` | card background |
| `--cm-bg-2` | `#16181c` | nested tile / KPI tile / table header |
| `--cm-bg-3` | `#1c1f24` | inline code / command chip |
| `--cm-bg-4` | `#242831` | deepest nesting |
| `--cm-line-1` | `rgba(255,255,255,0.06)` | card border, faint divider |
| `--cm-line-2` | `rgba(255,255,255,0.10)` | stronger divider, tile border |
| `--cm-line-3` | `rgba(255,255,255,0.16)` | emphasized border |

## Text

| Token | Dark value | Use |
|---|---|---|
| `--cm-fg-0` | `#f8fafc` | headings, the bolded number/word in a sentence |
| `--cm-fg-1` | `#d4d4d8` | body text |
| `--cm-fg-2` | `#a1a1aa` | secondary text, sub-labels |
| `--cm-fg-3` | `#71717a` | muted: captions, UPPERCASE labels, axis ticks |

## Accent & status

| Token | Dark value | Use |
|---|---|---|
| `--cm-accent` | user-chosen (`#4ade80` default) | the live accent — **always** via the token |
| `--cm-accent-soft` | `rgba(74,222,128,0.14)` | accent-tinted fill (icon chip, active row) |
| `--cm-accent-line` | `rgba(74,222,128,0.32)` | accent-tinted border |
| `--cm-ok` | `#22c55e` | healthy / success |
| `--cm-warn` | `#f59e0b` | warning / degraded |
| `--cm-err` | `#ef4444` | error / critical / over-budget |
| `--cm-info` | `#38bdf8` | informational |
| `--cm-cloud` | `#38bdf8` | cloud-provider tool accent |
| `--cm-k8s` | `#a78bfa` | kubernetes tool accent |
| `--cm-fs` | `#f59e0b` | filesystem tool accent |

**Accent rule (the #1187 bug class):** never write the accent's value. The user
can change their accent; a baked `#4ade80` fights it and the validator fails it
(`live-accent` + `off-palette-hex`). Always `var(--cm-accent)`.

## Radii & type

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `6–8px` | tiles, chips, inputs |
| `--radius-md` | `10px` | cards |
| `--radius-lg` | `14px` | large panels |
| `--cm-font-ui` | Inter, system-ui | body / UI; ~13–14px, line-height 1.5 |
| `--cm-font-mono` | JetBrains Mono | every datum/ID/command/timestamp |

A non-hex fallback on a radius/font token is fine (`var(--radius-md, 10px)`,
`var(--cm-font-mono, 'JetBrains Mono', monospace)`). A **hex** fallback is not —
`var(--cm-fg-1, #d4d4d8)` trips `off-palette-hex`. Drop the hex fallback; the host
always injects the token.

## The named semantic palette (only raw hex allowed — chart marks only)

`#f59e0b` aws/warn · `#38bdf8` azure/info · `#a78bfa` gcp/k8s · `#fcd34d` service
node · `#22c55e` ok · `#ef4444` err/target · `#f8fafc` mark text.

Use these only as SVG `fill`/`stop-color` on data marks. Chrome (frames, labels,
captions, table headers, dividers) is `var(--cm-*)`.

## Mono + tabular-nums (always, on figures)

```ts
const mono: React.CSSProperties = {
  fontFamily: "var(--cm-font-mono, 'JetBrains Mono', monospace)",
  fontVariantNumeric: "tabular-nums",
};
```
Apply `mono` to KPI values, savings figures, latencies, counts, IDs, commands,
timestamps — anything where columns of digits must line up.
