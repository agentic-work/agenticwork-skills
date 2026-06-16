import React from "react";

/**
 * FinopsSankey — tri-cloud cost-spike attribution as a hand-authored SVG sankey.
 *
 * Render path: render_artifact kind:"react" → parent esbuild-wasm transpile →
 * sandboxed iframe (connect-src 'none', pure render, no HITL).
 *
 * Consistency contract:
 *  - Chrome (frame, header, labels) resolves ALL colors via var(--cm-*) so it
 *    tracks the LIVE user theme + accent — never a hardcoded domain accent.
 *  - The ONLY raw hex is the small NAMED semantic palette for chart data marks
 *    (cloud category + state), exactly the colors the end-state mocks use.
 *  - viewBox is LOCKED to 0 0 800 380 (the sankey sizing lock the validator pins).
 */

// Named semantic palette — the only raw hex permitted (chart data marks only).
const CLOUD = {
  aws: "#f59e0b", // aws / warn
  azure: "#38bdf8", // azure / info
  gcp: "#a78bfa", // gcp / k8s
};
const SVC = "#fcd34d"; // service node
const SPEND = "#ef4444"; // spend bucket / target
const MARK_FG = "#f8fafc"; // neutral text inside SVG marks

type Source = { id: keyof typeof CLOUD; label: string; sub: string; y: number; h: number };
const SOURCES: Source[] = [
  { id: "aws", label: "AWS", sub: "+$17,592 · 5 services", y: 30, h: 110 },
  { id: "azure", label: "Azure", sub: "+$13,175 · 3 services", y: 160, h: 90 },
  { id: "gcp", label: "GCP", sub: "+$5,799 · 2 services", y: 270, h: 70 },
];

type Spike = { label: string; y: number; h: number };
const SPIKES: Spike[] = [
  { label: "NAT gw +$8.4k", y: 40, h: 60 },
  { label: "CW logs +$4.8k", y: 110, h: 36 },
  { label: "EBS +$2.9k", y: 156, h: 22 },
  { label: "AzureOpenAI +$6.1k", y: 190, h: 38 },
  { label: "Bandwidth +$2.4k", y: 238, h: 18 },
  { label: "Vertex +$3.4k", y: 266, h: 22 },
  { label: "BigQuery +$1.4k", y: 296, h: 14 },
];

type Bucket = { label: string; sub: string; y: number; h: number };
const BUCKETS: Bucket[] = [
  { label: "network egress", sub: "+$13.6k", y: 50, h: 100 },
  { label: "AI / models", sub: "+$9.5k", y: 160, h: 80 },
  { label: "compute / storage", sub: "+$13.5k", y: 250, h: 60 },
];

// Cloud-source → spend-bucket flow ribbons (cubic-bezier sankey links).
const RIBBONS = [
  { d: "M 40 30 C 200 30, 220 40, 370 40 L 370 100 C 220 100, 200 140, 40 140 Z", grad: "ga", op: 1 },
  { d: "M 40 160 C 200 160, 220 190, 370 190 L 370 228 C 220 228, 200 250, 40 250 Z", grad: "gz", op: 1 },
  { d: "M 40 270 C 200 270, 220 266, 370 266 L 370 310 C 220 310, 200 340, 40 340 Z", grad: "gg", op: 1 },
  { d: "M 384 40 C 540 40, 540 50, 700 50 L 700 150 C 540 150, 540 100, 384 100 Z", grad: "ga", op: 0.5 },
  { d: "M 384 190 C 540 190, 540 160, 700 160 L 700 240 C 540 240, 540 228, 384 228 Z", grad: "gz", op: 0.5 },
  { d: "M 384 266 C 540 266, 540 250, 700 250 L 700 310 C 540 310, 540 310, 384 310 Z", grad: "gg", op: 0.5 },
];

export default function FinopsSankey() {
  const frame: React.CSSProperties = {
    background: "var(--cm-bg-1)",
    border: "1px solid var(--cm-line-1)",
    borderLeft: "3px solid var(--cm-accent)",
    borderRadius: "var(--radius-md, 10px)",
    padding: "12px 14px 6px",
    fontFamily: "var(--cm-font-ui, 'Inter', system-ui, sans-serif)",
    color: "var(--cm-fg-1)",
  };
  const head: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    fontSize: "12px",
  };
  const dot: React.CSSProperties = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--cm-accent)",
  };
  const title: React.CSSProperties = { color: "var(--cm-fg-0)", fontWeight: 600 };
  const caption: React.CSSProperties = {
    color: "var(--cm-fg-3)",
    fontFamily: "var(--cm-font-mono, 'JetBrains Mono', monospace)",
    fontSize: "11px",
    marginLeft: "auto",
  };

  return (
    <div style={frame}>
      <div style={head}>
        <span style={dot} />
        <span style={title}>Cost spikes · cloud → service → spend bucket</span>
        <span style={caption}>+$36,566 / mo</span>
      </div>

      <svg viewBox="0 0 800 380" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="ga" x1="0" x2="1">
            <stop offset="0" stopColor={CLOUD.aws} stopOpacity="0.55" />
            <stop offset="1" stopColor={SPEND} stopOpacity="0.30" />
          </linearGradient>
          <linearGradient id="gz" x1="0" x2="1">
            <stop offset="0" stopColor={CLOUD.azure} stopOpacity="0.55" />
            <stop offset="1" stopColor={SPEND} stopOpacity="0.30" />
          </linearGradient>
          <linearGradient id="gg" x1="0" x2="1">
            <stop offset="0" stopColor={CLOUD.gcp} stopOpacity="0.55" />
            <stop offset="1" stopColor={SPEND} stopOpacity="0.30" />
          </linearGradient>
        </defs>

        {/* flow ribbons first, so node rects + labels paint on top */}
        {RIBBONS.map((r, i) => (
          <path key={i} d={r.d} fill={`url(#${r.grad})`} opacity={r.op} />
        ))}

        {/* cloud source nodes (left) */}
        {SOURCES.map((s) => (
          <g key={s.id}>
            <rect x={20} y={s.y} width={20} height={s.h} fill={CLOUD[s.id]} rx={4} />
            <text
              x={50}
              y={s.y + 32}
              fill="var(--cm-fg-0)"
              fontFamily="var(--cm-font-ui, 'Inter', sans-serif)"
              fontSize="13"
              fontWeight={600}
            >
              {s.label}
            </text>
            <text
              x={50}
              y={s.y + 50}
              fill="var(--cm-fg-3)"
              fontFamily="var(--cm-font-mono, 'JetBrains Mono', monospace)"
              fontSize="11"
            >
              {s.sub}
            </text>
          </g>
        ))}

        {/* service-spike nodes (middle) */}
        {SPIKES.map((s, i) => (
          <g key={i}>
            <rect x={370} y={s.y} width={14} height={s.h} fill={SVC} rx={3} />
            <text x={392} y={s.y + 16} fill={MARK_FG} fontFamily="var(--cm-font-mono, monospace)" fontSize="11">
              {s.label}
            </text>
          </g>
        ))}

        {/* spend-bucket nodes (right) */}
        {BUCKETS.map((b, i) => (
          <g key={i}>
            <rect x={700} y={b.y} width={20} height={b.h} fill={SPEND} rx={4} />
            <text
              x={660}
              y={b.y + 26}
              textAnchor="end"
              fill="var(--cm-fg-1)"
              fontFamily="var(--cm-font-ui, sans-serif)"
              fontSize="12"
            >
              {b.label}
            </text>
            <text
              x={660}
              y={b.y + 44}
              textAnchor="end"
              fill="var(--cm-fg-3)"
              fontFamily="var(--cm-font-mono, monospace)"
              fontSize="11"
            >
              {b.sub}
            </text>
          </g>
        ))}

        {/* column legends */}
        <text x={20} y={375} fill="var(--cm-fg-3)" fontFamily="var(--cm-font-mono, monospace)" fontSize="10">
          Cloud
        </text>
        <text x={385} y={375} fill="var(--cm-fg-3)" fontFamily="var(--cm-font-mono, monospace)" fontSize="10">
          Top Service Spikes
        </text>
        <text
          x={780}
          y={375}
          textAnchor="end"
          fill="var(--cm-fg-3)"
          fontFamily="var(--cm-font-mono, monospace)"
          fontSize="10"
        >
          Spend Bucket
        </text>
      </svg>
    </div>
  );
}
