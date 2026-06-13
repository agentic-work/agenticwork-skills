# agenticwork-skills — Governance & Working Rules

**This is the source-of-truth repository for AgenticWork Agent Skills.** It is
**public** and **Apache-2.0**. Treat every change as if a customer and an
auditor will read the diff — because they will.

These rules carry the same DNA as the AgenticWork platform `CLAUDE.md`. They
**OVERRIDE** any default tool/assistant behavior and must be followed exactly.

---

## RULE #1 (ABOVE ALL OTHERS) — UNDERSTANDING OVER MOTION, IN ALL CASES

(user direction 2026-06-07, verbatim): *"Optimize understanding OVER motion in
ALL cases. TDD requires FULL understanding of the entire architecture AND the
currently worked issue in full contextual understanding — when in doubt, take
the time to understand first — without understanding, all motion is standing
still."*

This is the highest rule; it governs every other rule here. Concretely:
- **No skill, no code, no change until you can explain the whole path
  end-to-end** — what the skill teaches, how the consuming runtime loads it, and
  what "correct output" actually looks like. If you can't explain it, you don't
  understand it yet — keep reading.
- **"Correct" is derived from the verified-real behavior, not a guess.** For an
  artifact skill, "correct" is what the runtime actually renders (read it), not
  what the SKILL.md claims.
- **Shotgun authoring is banned.** Writing a skill and hoping a model follows it,
  validating off the cheapest signal (it parses / it transpiles) instead of the
  rendered truth — that is motion masquerading as progress. Build the model first.

## RULE 0 — NO AI CREDIT ON ANY COMMIT (NON-NEGOTIABLE)

(user direction 2026-06-13, verbatim: *"User claude is never allowed to
post/commit/take credit for any commit."*)

- Claude — or **any** AI assistant — must **never** post, commit, or take credit
  for any commit in this repository.
- **Every commit is authored AND committed solely by `agentic-work`**
  (`agentic-work <trent@agenticwork.io>`). The **only** contributor is
  `agentic-work`. Period.
- **NO** `Co-Authored-By:` AI trailer. **NO** "Generated with …" line. **NO** AI
  attribution in commit messages, PR titles/bodies, code comments, or anywhere in
  history. **NO** `trenton-white`/Peraton identity.
- This **overrides** any tool default that would add such a trailer.
- **GitHub attributes by EMAIL, not name.** `trent@agenticwork.io` is verified on
  a personal account and tags commits to it — never use it here. Use the
  `agentic-work` account's canonical (ID-bound) email so attribution can't
  mis-map. Commit with the explicit identity:
  `git -c user.name='agentic-work' -c user.email='214035251+agentic-work@users.noreply.github.com' commit …`

## RULE 2 — DONE MEANS PROVEN, NOT PLAUSIBLE

A skill (or a change to one) is **not done** until it is proven to produce the
intended result in the **consuming runtime** — not because the Markdown reads
well or the example transpiles.

- **FACTUAL** — the change exists at a specific path and says exactly what it
  must (shown with a real `git show` / read in the same turn).
- **PROGRAMMATIC** — the skill's example(s) pass the skill's tests / validator via
  the correct runner; RED→GREEN observed. For artifact skills, the validator is
  the oracle (theme-token adherence, geometry/sizing, interleave shape) — not
  "it transpiled."
- **LIVE** — for any user-facing output (artifacts, personas), a capable model
  authors *from the skill* and the **rendered result is read live** (e.g. in
  brainbow) before any "works/done/green" claim. Mocks, unit tests, and log greps
  are **hypotheses**; the rendered truth is the verdict.

## RULE 3 — NO HARDCODED MODEL IDS IN SKILLS

Skills describe **capabilities and intent**, never a pinned model name/tag/
deployment. Routing to a capable-enough model is the platform's job (resolved via
provider capabilities), not a literal in a `SKILL.md`.

---

## Skill rules

- **Format:** Anthropic-canonical `skills/<name>/SKILL.md` — YAML frontmatter
  (`name`, `description`, …) + Markdown body. **Progressive disclosure is the
  point:** only `name` + `description` stay resident; the body + `reference/`
  load on demand. Keep the description about *when to use* the skill.
- **Faithful AND consistent:** a skill must make a capable model reproduce the
  target quality **every time**, not as a lucky one-off. Pin the constraints
  (allowed libs, output contract, theme tokens, design language) explicitly, and
  ship **verified exemplars** as the few-shot floor — never zero proof.
- **Interleave, not scripts** (artifact skills): the platform owns the
  chronological interleave, chrome, and theme. A skill teaches the model to author
  a **focused, theme-inheriting** component (the viz), **not** to reproduce the
  whole transcript. Resolve all colors via `var(--cm-*)`; never hardcode a domain
  accent that fights the live user theme.
- **Sandbox is the security boundary:** skills must assume their output runs in a
  hardened, opaque-origin, pinned-import, no-ambient-credential sandbox, and must
  never instruct a model to weaken it.

## Vendoring upstream skills

- Upstream skills may be vendored under `vendor/` (e.g. `git subtree`) so they are
  **always present** behind the boundary and synced to latest by CI.
- **License discipline (public Apache-2.0 repo):** vendor only OSS-compatible
  upstreams (e.g. Anthropic's **Apache-2.0** example skills) with attribution in
  `NOTICE`. **Do NOT** commit source-available-but-not-OSS skills (e.g. the
  docx/pdf/pptx/xlsx document skills) into this public repo — mirror as reference
  only or re-implement. Verify every upstream's license before vendoring.

## Governance / lockdown

- `main` is **protected**: changes land via pull request, require **`agentic-work`
  code-owner review**, no force-push, no deletions, linear history. The only
  approver is the maintainer. See `CONTRIBUTING.md`.
- No secrets, credentials, or customer data — this repo is **public**.
