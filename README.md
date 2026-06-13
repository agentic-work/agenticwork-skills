<div align="center">

# agenticwork-skills

**The source-of-truth repository for Agent Skills across the AgenticWork platform —
portable, progressively-disclosed capability modules that any compatible agent runtime can load.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Skills format](https://img.shields.io/badge/format-Agent%20Skills-6E56CF.svg)](#skill-format)

</div>

---

## What this is

A **skill** is a self-contained Markdown module (`SKILL.md`) that teaches a model
*how* to do something well — the conventions, constraints, and worked patterns it
needs to produce expert-quality output **faithfully and consistently**, without the
host application hard-coding a template for every case.

Skills use **progressive disclosure**: a skill's `name` + `description` stay resident
in the model's context (cheap), and the full body is loaded **on demand** only when the
task calls for it. The model decides, in-context, when to read a skill — there is no
separate router.

This repository is the **single source of truth** for the skills AgenticWork ships, and
it is designed to be consumed across runtimes:

| Consumer | How it loads skills |
|---|---|
| **AgenticWork** | Synced into the platform skill registry; surfaced to chat / flows / codemode via the on-demand skill tools |
| **OpenAgentic** | Imported as the canonical skill set |
| **Claude** (Anthropic Agent Skills) | Format-compatible with `anthropics/skills` — installable as a skill set |
| **OpenClaw** & other open agent/persona systems | Plain `SKILL.md` + resources; load directly from the repo |

## Skill format

Each skill lives in its own directory and is consumable by any Agent-Skills-compatible runtime:

```
skills/
  <skill-name>/
    SKILL.md          # YAML frontmatter (name, description, …) + the skill body
    resources/        # optional reference material loaded on demand
    scripts/          # optional helper scripts the skill may invoke
```

`SKILL.md` frontmatter (minimum):

```yaml
---
name: inline-artifact-design
description: >-
  Use when a user asks for a rich inline/interactive visualization, dashboard, or
  scene rendered in the chat. Teaches how to author a single default-exported React
  component, using only the curated pinned libraries, that renders at production
  fidelity in the sandboxed artifact iframe.
---
```

The body is standard Markdown — instructions, constraints, and worked examples. Keep
the **name + description** tight (they are always resident); push detail into the body
and `resources/` (loaded only when the skill is opened).

## Flagship skill — inline/interleave artifact authoring

The headline skill in this set lets a capable model **author unique, production-grade
inline artifacts on demand** — charts, dashboards, 3D scenes — as a single React
component, rendered in a hardened sandboxed iframe, **without the platform shipping a
hard-coded template for every layout**. The skill is what makes that output *faithful
and consistent* rather than a lucky one-off: it pins the curated library set, the theme
tokens, the default-export contract, and the design language the output must follow.

## Governance

- Maintained by **[@agentic-work](https://github.com/agentic-work)**.
- `main` is protected: changes land via pull request and require maintainer review
  (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- Contributions are accepted under [Apache-2.0](LICENSE) (see [the DCO note](CONTRIBUTING.md#developer-certificate-of-origin)).

## License

[Apache License 2.0](LICENSE) — see [NOTICE](NOTICE) for attribution. Some skills may
reference upstream skills (e.g. Anthropic's `anthropics/skills`) that carry their own
licenses; those are noted per-skill where applicable.
