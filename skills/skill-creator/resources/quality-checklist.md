# Skill quality checklist (pre-commit)

Run this before opening a PR for any new or edited skill. A skill is **not done**
until it is proven to produce the intended result in the consuming runtime — not
because the Markdown reads well.

## Frontmatter

- [ ] `name` is kebab-case and **matches the directory** (`skills/<name>/`).
- [ ] `description` says **WHEN to use** the skill (a trigger), not how it works.
- [ ] `description` is 1–3 sentences. It lives in the resident budget — keep it tight.
- [ ] No hardcoded model id / tag / provider / deployment anywhere in the file.

## Progressive disclosure

- [ ] Only `name` + `description` carry the "should I open this?" signal.
- [ ] All "how" detail (constraints, contracts, long tables, edge cases) is in the
      **body** or `resources/` — loaded on demand, not resident.
- [ ] Large reference material is split into `resources/*.md`, linked from the body.

## Consistency contract

- [ ] Constraints are explicit: allowed libraries, output contract, an explicit
      **DO NOT** list.
- [ ] Dependencies are **curated and pinned** — never "install what you need."
- [ ] At least one **worked example** is included as the few-shot floor.
- [ ] Each worked example was **actually run against its oracle** and passed
      (RED→GREEN observed), not eyeballed.

## Artifact skills only — behavioral eval

The output must pass `validateInlineArtifact` (`inlineArtifactValidator.ts`). For
every example component in the skill:

- [ ] Exactly one `export default` component (`default-export`).
- [ ] Imports caged to `react`, `react-dom`, `react-dom/client`, `three`
      (`import-cage`) — nothing else resolves in the sandbox.
- [ ] The accent resolves via `var(--cm-accent)` (`live-accent`) — no baked domain
      accent literal.
- [ ] All colors via `var(--cm-*)`; raw hex only from the named semantic palette
      (`off-palette-hex`): `#f59e0b #38bdf8 #a78bfa #fcd34d #22c55e #ef4444 #f8fafc`.
- [ ] SVG `viewBox` matches the declared chart dimensions (`viewbox-sizing`).
- [ ] It transpiles clean through the real transpiler with the cage applied.
- [ ] Verified: `validateInlineArtifact(src, { expectViewBox }).pass === true` with an
      empty `violations` array.

## Security / public-repo hygiene

- [ ] No secrets, credentials, tokens, internal hostnames, or customer data.
- [ ] The skill never instructs the model to weaken the sandbox (ambient creds,
      unpinned imports, widened CSP/connect-src).

## Governance

- [ ] Lands via PR with code-owner (`agentic-work`) review; `main` is protected.
- [ ] Commit authored AND committed solely by `agentic-work` — no AI attribution,
      no Co-Authored-By trailer, anywhere.
