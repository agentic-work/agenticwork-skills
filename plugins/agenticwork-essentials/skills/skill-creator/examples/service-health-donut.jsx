// Verified exemplar — passes validateInlineArtifact({ expectViewBox: '0 0 400 320' })
// with zero violations. A second focused viz showing the same contract on a different
// chart: single default export, imports caged to react, accent via var(--cm-accent),
// surface/text via var(--cm-*), data marks from the named semantic palette, locked
// viewBox. The model pattern-matches this shape — it does not template it.
import React from 'react';

const SERVICES = [
  { id: 'aws', label: 'AWS', up: 42, color: '#f59e0b' },
  { id: 'azure', label: 'Azure', up: 28, color: '#38bdf8' },
  { id: 'gcp', label: 'GCP', up: 19, color: '#a78bfa' },
];

export default function ServiceHealthDonut() {
  const total = SERVICES.reduce((s, c) => s + c.up, 0);
  const R = 120, C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = SERVICES.map((s) => {
    const frac = s.up / total;
    const arc = { ...s, dash: frac * C, gap: C - frac * C, off: offset };
    offset -= frac * C;
    return arc;
  });
  return (
    <div style={{ fontFamily: 'var(--cm-font-ui, system-ui, sans-serif)', color: 'var(--cm-fg-1)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, padding: '2px 0 8px',
        borderLeft: '3px solid var(--cm-accent)', paddingLeft: 10 }}>
        Healthy services by cloud · {total} up
      </div>
      <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" style={{ width: '100%' }}>
        <g transform="translate(200 160) rotate(-90)">
          {arcs.map((a) => (
            <circle key={a.id} r="120" fill="none" stroke={a.color} strokeWidth="34"
              strokeDasharray={a.dash + ' ' + a.gap} strokeDashoffset={a.off} />
          ))}
        </g>
        <text x="200" y="156" textAnchor="middle" style={{ fill: 'var(--cm-fg-1)', font: '700 30px var(--cm-font-ui)' }}>{total}</text>
        <text x="200" y="178" textAnchor="middle" style={{ fill: 'var(--cm-fg-3)', font: '11px var(--cm-font-mono)' }}>services up</text>
        {arcs.map((a, i) => (
          <g key={a.id} transform={'translate(40 288)'}>
            <rect x={i * 120} y="0" width="11" height="11" rx="3" fill={a.color} />
            <text x={i * 120 + 18} y="10" style={{ fill: 'var(--cm-fg-2)', font: '11px var(--cm-font-ui)' }}>{a.label} {a.up}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
