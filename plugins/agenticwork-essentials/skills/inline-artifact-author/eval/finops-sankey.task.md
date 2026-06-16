Build an inline artifact: a **tri-cloud monthly spend sankey** for a FinOps
dashboard. Three sources — AWS $17,592, Azure $13,175, GCP $5,799 — flow into a
single "Spend" target node on the right.

Requirements:

- Bar height and link width MUST be proportional to spend (the sum of the three
  link widths equals the target bar height).
- Use the cloud-category colors for the source bars/links and the spend-target
  color for the target bar.
- The title rule and the "Spend ↑" emphasis MUST inherit the live theme accent.
- Pure SVG, no chart runtime.
- The sankey sizing lock is a `viewBox` of `0 0 800 380`.
