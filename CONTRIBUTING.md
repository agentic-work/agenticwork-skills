# Contributing to agenticwork-skills

Thanks for your interest in improving the AgenticWork skill set.

## Ground rules

- **`main` is protected.** All changes land through a pull request; direct pushes to
  `main` are reserved for the maintainer. Every PR requires review and approval from a
  code owner ([@agentic-work](https://github.com/agentic-work)) before it can be merged.
- **One skill per directory.** Put new skills under `skills/<skill-name>/SKILL.md`.
- **Keep the frontmatter tight.** `name` + `description` are always resident in the
  model's context — make the description say *when to use the skill*, not how. Push the
  "how" into the body and `resources/`.
- **No secrets, no credentials, no customer data.** This repository is **public**.

## How to propose a change

1. Fork the repository and create a topic branch from `main`.
2. Make your change. For a new skill, include a complete `SKILL.md` with valid YAML
   frontmatter and at least one worked example in the body.
3. Open a pull request describing the change and the problem it solves.
4. A maintainer will review. Address feedback; once approved, a maintainer merges.

## Skill quality bar

A good skill makes a capable model produce expert output **consistently**:

- State the **constraints** explicitly (allowed libraries, output contract, theme
  tokens, what *not* to do).
- Include **worked examples** that the model can pattern-match against.
- Prefer **pinned, curated dependencies** over "install whatever you need" — runtimes
  resolve imports against a fixed allowlist, so an un-pinned dependency simply will not
  load.

## Developer Certificate of Origin

By contributing, you certify that you wrote the contribution or have the right to submit
it under the project's [Apache-2.0](LICENSE) license (the
[Developer Certificate of Origin](https://developercertificate.org/)). Sign your commits
with `git commit -s` where practical.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you
agree to uphold it.
