import React from "react";

/**
 * SavingsDashboard — a KPI strip + ranked savings_grid, the compose_app
 * "specific cuts · monthly savings · effort" card the end-state finops mock ships.
 *
 * Render path: render_artifact kind:"react" → parent esbuild-wasm transpile →
 * sandboxed iframe (connect-src 'none', pure render, no HITL).
 *
 * Consistency contract:
 *  - Surfaces, borders, text, AND the headline accent all resolve via var(--cm-*)
 *    so the card tracks the LIVE theme + user accent (no hardcoded domain accent).
 *  - Status is encoded by BOTH a semantic var (--cm-ok/warn/err on the 3px
 *    left-border) AND text — never color alone.
 *  - Numbers use the mono face + tabular-nums so figures align in a column.
 *  - No SVG here → no viewBox; this is a pure HTML/flex card, not a chart.
 */

type Sev = "ok" | "warn" | "err";

// Status → the live theme token to resolve. The card NEVER hardcodes a status hex.
const SEV_VAR: Record<Sev, string> = {
  ok: "var(--cm-ok)",
  warn: "var(--cm-warn)",
  err: "var(--cm-err)",
};

type Kpi = { label: string; value: string; sub: string; sev?: Sev };
const KPIS: Kpi[] = [
  { label: "monthly spend", value: "$71,204", sub: "+18% vs prior 30d", sev: "warn" },
  { label: "identified savings", value: "$26,800", sub: "8 actionable cuts", sev: "ok" },
  { label: "fastest win", value: "5 min", sub: "drop debug log level", sev: "ok" },
  { label: "at-risk budget", value: "112%", sub: "over Q3 envelope", sev: "err" },
];

type Cut = { tag: string; save: string; title: string; body: string; effort: string; cmd: string; sev: Sev };
const CUTS: Cut[] = [
  { tag: "cut #1 · cross-az nat", save: "-$7,800/mo", title: "Route egress through a VPC endpoint", body: "S3/STS/SecretsManager — 80% of NAT traffic today.", effort: "2h", cmd: "terraform apply nat-fix.tf", sev: "ok" },
  { tag: "cut #2 · cw debug logs", save: "-$4,800/mo", title: "Drop log level to WARN on mcp-proxy", body: "Debug was left on after the 2026-04 deploy.", effort: "5m", cmd: "helm set LOG_LEVEL=warn", sev: "ok" },
  { tag: "cut #3 · prompt cache miss", save: "-$4,200/mo", title: "Attach cache_control on the system prompt", body: "92% cache-miss on the codegen path.", effort: "1d", cmd: "adapters/ToResponses.ts", sev: "warn" },
  { tag: "cut #4 · orphan ebs vols", save: "-$2,800/mo", title: "Delete 14 unattached gp3 volumes", body: "Test cluster was destroyed Mar 18 — volumes leaked.", effort: "15m · review", cmd: "aws ec2 delete-volume ×14", sev: "warn" },
  { tag: "cut #5 · weekend rds", save: "-$1,500/mo", title: "Stop staging Aurora Fri→Mon", body: "64h/wk idle × $24/h on a non-prod cluster.", effort: "30m", cmd: "rds stop-db-cluster", sev: "warn" },
  { tag: "cut #6 · acr image pulls", save: "-$1,400/mo", title: "Mirror dockerhub images into ACR", body: "AKS bandwidth on public pulls grew 5×.", effort: "2d", cmd: "image-mirror cron", sev: "err" },
];

export default function SavingsDashboard() {
  const card: React.CSSProperties = {
    background: "var(--cm-bg-1)",
    border: "1px solid var(--cm-line-1)",
    borderLeft: "3px solid var(--cm-accent)",
    borderRadius: "var(--radius-md, 10px)",
    padding: "14px",
    fontFamily: "var(--cm-font-ui, 'Inter', system-ui, sans-serif)",
    color: "var(--cm-fg-1)",
    fontSize: "13px",
  };
  const head: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" };
  const dot: React.CSSProperties = { width: "8px", height: "8px", borderRadius: "50%", background: "var(--cm-accent)" };
  const title: React.CSSProperties = { color: "var(--cm-fg-0)", fontWeight: 600, fontSize: "13px" };
  const caption: React.CSSProperties = {
    marginLeft: "auto",
    color: "var(--cm-fg-3)",
    fontFamily: "var(--cm-font-mono, 'JetBrains Mono', monospace)",
    fontSize: "11px",
  };
  const kpiRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginBottom: "14px",
  };
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" };
  const mono: React.CSSProperties = {
    fontFamily: "var(--cm-font-mono, 'JetBrains Mono', monospace)",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div style={card}>
      <div style={head}>
        <span style={dot} />
        <span style={title}>FinOps · savings plan</span>
        <span style={caption}>specific cuts · monthly savings · effort</span>
      </div>

      {/* KPI strip — status by token + text, never color alone */}
      <div style={kpiRow}>
        {KPIS.map((k) => {
          const accent = k.sev ? SEV_VAR[k.sev] : "var(--cm-accent)";
          return (
            <div
              key={k.label}
              style={{
                background: "var(--cm-bg-2)",
                border: "1px solid var(--cm-line-2)",
                borderTop: `3px solid ${accent}`,
                borderRadius: "var(--radius-sm, 8px)",
                padding: "11px",
              }}
            >
              <div
                style={{
                  fontSize: "9.5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--cm-fg-3)",
                  marginBottom: "4px",
                }}
              >
                {k.label}
              </div>
              <div style={{ ...mono, fontSize: "22px", fontWeight: 700, lineHeight: 1, color: accent }}>{k.value}</div>
              <div style={{ marginTop: "3px", fontSize: "11px", color: "var(--cm-fg-2)" }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ranked savings cards — left-border severity + the text label */}
      <div style={grid}>
        {CUTS.map((c) => {
          const accent = SEV_VAR[c.sev];
          return (
            <div
              key={c.tag}
              style={{
                background: "var(--cm-bg-2)",
                border: "1px solid var(--cm-line-2)",
                borderLeft: `3px solid ${accent}`,
                borderRadius: "var(--radius-md, 10px)",
                padding: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--cm-fg-2)",
                  }}
                >
                  {c.tag}
                </span>
                <span style={{ ...mono, fontWeight: 700, fontSize: "16px", color: accent }}>{c.save}</span>
              </div>
              <div style={{ color: "var(--cm-fg-1)", lineHeight: 1.5, fontSize: "12.5px" }}>
                <b style={{ color: "var(--cm-fg-0)" }}>{c.title}</b> — {c.body}{" "}
                <span style={{ ...mono, fontSize: "10px", color: "var(--cm-fg-3)" }}>effort: {c.effort}</span>
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: "11px",
                  background: "var(--cm-bg-3)",
                  border: "1px solid var(--cm-line-2)",
                  borderRadius: "4px",
                  padding: "3px 7px",
                  color: "var(--cm-accent)",
                  marginTop: "6px",
                  display: "inline-block",
                }}
              >
                {c.cmd}
              </div>
            </div>
          );
        })}
        <div
          style={{
            ...mono,
            gridColumn: "1 / -1",
            textAlign: "right",
            paddingTop: "8px",
            borderTop: "1px solid var(--cm-line-2)",
            marginTop: "4px",
          }}
        >
          total identified savings{" "}
          <b style={{ fontSize: "18px", color: "var(--cm-accent)" }}>-$26,800/mo</b>
        </div>
      </div>
    </div>
  );
}
