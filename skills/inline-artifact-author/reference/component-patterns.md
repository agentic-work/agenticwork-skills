# Component patterns — copy-paste at mock fidelity

Every snippet is token-correct (no hex except named-palette marks, accent via
`var(--cm-accent)`, mono+tabular figures). Drive each by `.map()` over typed data.

## Shared helpers (put at top of every component)

```tsx
const mono: React.CSSProperties = {
  fontFamily: "var(--cm-font-mono, 'JetBrains Mono', monospace)",
  fontVariantNumeric: "tabular-nums",
};
type Sev = "ok" | "warn" | "err";
const SEV_VAR: Record<Sev, string> = {
  ok: "var(--cm-ok)",
  warn: "var(--cm-warn)",
  err: "var(--cm-err)",
};
```

## Card shell (the base for every dashboard/card)

```tsx
const card: React.CSSProperties = {
  background: "var(--cm-bg-1)",
  border: "1px solid var(--cm-line-1)",
  borderLeft: "3px solid var(--cm-accent)", // or SEV_VAR[sev] for a status card
  borderRadius: "var(--radius-md, 10px)",
  padding: "14px",
  fontFamily: "var(--cm-font-ui, 'Inter', system-ui, sans-serif)",
  color: "var(--cm-fg-1)",
  fontSize: "13px",
};
```
Header = a `var(--cm-accent)` dot + `var(--cm-fg-0)` title + a right-aligned mono
`var(--cm-fg-3)` caption.

## KPI strip

4 tiles, equal columns, **3px top border** keyed to status; value in mono 22px
tinted to the status token; label UPPERCASE 9.5px `var(--cm-fg-3)`.

```tsx
<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
  {KPIS.map((k) => {
    const a = k.sev ? SEV_VAR[k.sev] : "var(--cm-accent)";
    return (
      <div key={k.label} style={{ background: "var(--cm-bg-2)", border: "1px solid var(--cm-line-2)", borderTop: `3px solid ${a}`, borderRadius: "var(--radius-sm, 8px)", padding: "11px" }}>
        <div style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--cm-fg-3)", marginBottom: "4px" }}>{k.label}</div>
        <div style={{ ...mono, fontSize: "22px", fontWeight: 700, lineHeight: 1, color: a }}>{k.value}</div>
        <div style={{ marginTop: "3px", fontSize: "11px", color: "var(--cm-fg-2)" }}>{k.sub}</div>
      </div>
    );
  })}
</div>
```

## Savings grid / ranked-action card

2-column grid of cards; **3px left border** by severity; the figure mono+bold and
tinted; a command chip on `var(--cm-bg-3)` with `var(--cm-accent)` text; a total
row that spans both columns. Full version: `examples/SavingsDashboard.tsx`.

## Incident / runbook / root-cause card

Same shell, left border `SEV_VAR[sev]`. Header carries a status **pill**: small
rounded `var(--cm-bg-2)` chip, a 6px status-token dot, and the status **word**
(`CRITICAL` / `DEGRADED` / `HEALTHY`) — status by token **and** text. Body is
labeled rows (label `var(--cm-fg-3)` UPPERCASE, value `var(--cm-fg-1)`); commands
and timestamps in mono.

## Permission / compliance matrix

A `<table>` (or CSS grid). Sticky header row on `var(--cm-bg-2)` with mono
UPPERCASE `var(--cm-fg-3)` headers. Cells: a value/allow-deny **pill** —
`var(--cm-ok)` text on `var(--cm-accent-soft)`-style tint for allow,
`var(--cm-err)` for deny — **always with the word** (`allow` / `deny`), never a
bare color. Row divider `1px solid var(--cm-line-1)`.

## Streaming / data table

```tsx
<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
  <thead>
    <tr>
      {COLS.map((c) => (
        <th key={c} style={{ position: "sticky", top: 0, textAlign: "left", padding: "7px 10px", background: "var(--cm-bg-2)", color: "var(--cm-fg-3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--cm-line-2)" }}>{c}</th>
      ))}
    </tr>
  </thead>
  <tbody>
    {ROWS.map((r, i) => (
      <tr key={i} style={{ borderBottom: "1px solid var(--cm-line-1)" }}>
        <td style={{ padding: "6px 10px", color: "var(--cm-fg-1)" }}>{r.name}</td>
        <td style={{ ...mono, padding: "6px 10px", color: "var(--cm-fg-0)", textAlign: "right" }}>{r.value}</td>
        <td style={{ padding: "6px 10px" }}>
          <span style={{ ...mono, fontSize: "10px", padding: "1px 7px", borderRadius: "3px", border: "1px solid var(--cm-line-2)", color: SEV_VAR[r.sev] }}>{r.status}</span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```
Data columns (numbers/IDs) are mono + right-aligned; status is a pill with the
word + the token color. Sticky header via `position:"sticky", top:0`.

## Reminders that apply to every pattern

- One `export default` component; data as typed top-level consts; render via `.map()`.
- Accent = `var(--cm-accent)`. Status = token + text. No hex except named marks.
- No hex inside `var()` fallbacks. Mono + `tabular-nums` on every figure.
