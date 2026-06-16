// Verified exemplar — passes validateInlineArtifact({ expectViewBox: '0 0 800 380' })
// with zero violations, and transpiles clean through inlineReactTranspiler caged to
// react. The "interleave, not scripts" shape: JUST the viz — the platform owns
// chrome/interleave/theme. Accent via var(--cm-accent) (inherits live theme); only
// the cloud-category + spend data marks use the named semantic palette.
import React from 'react';

const CLOUDS = [
  { id: 'aws', label: 'AWS', spend: 17592, color: '#f59e0b' },
  { id: 'azure', label: 'Azure', spend: 13175, color: '#38bdf8' },
  { id: 'gcp', label: 'GCP', spend: 5799, color: '#a78bfa' },
];

export default function FinopsSankey() {
  const total = CLOUDS.reduce((s, c) => s + c.spend, 0);
  const H = 300, TOP = 40, SCALE = H / total;
  let y = TOP;
  const rows = CLOUDS.map((c) => {
    const h = c.spend * SCALE; // bar height proportional to spend
    const row = { ...c, y, h, cy: y + h / 2 };
    y += h + 8;
    return row;
  });
  const targetH = rows.reduce((s, r) => s + r.h, 0); // link widths sum == bars
  return (
    <div style={{ fontFamily: 'var(--cm-font-ui, system-ui, sans-serif)', color: 'var(--cm-fg-1)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, padding: '2px 0 8px',
        borderLeft: '3px solid var(--cm-accent)', paddingLeft: 10 }}>
        Tri-cloud spend flow · +{'$'}{(total / 1000).toFixed(1)}k / mo
      </div>
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMidYMid meet" style={{ width: '100%' }}>
        {rows.map((r) => (
          <g key={r.id}>
            <rect x="20" y={r.y} width="20" height={r.h} rx="4" fill={r.color} />
            <text x="50" y={r.cy - 4} style={{ fill: 'var(--cm-fg-1)', font: '600 12px var(--cm-font-ui)' }}>{r.label}</text>
            <text x="50" y={r.cy + 12} style={{ fill: 'var(--cm-fg-3)', font: '10px var(--cm-font-mono)' }}>+{'$'}{r.spend.toLocaleString()}</text>
            <path d={'M 40 ' + r.cy + ' C 240 ' + r.cy + ', 540 190, 740 190'}
              stroke={r.color} strokeOpacity="0.45" strokeWidth={r.h} fill="none" strokeLinecap="round" />
          </g>
        ))}
        <rect x="740" y={190 - targetH / 2} width="20" height={targetH} rx="4" fill="#ef4444" />
        <text x="730" y="184" textAnchor="end" style={{ fill: 'var(--cm-accent)', font: '600 12px var(--cm-font-ui)' }}>Spend ↑</text>
      </svg>
    </div>
  );
}
