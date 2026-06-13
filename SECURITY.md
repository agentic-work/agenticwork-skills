# Security Policy

## Reporting a vulnerability

If you discover a security issue in this repository — for example a skill that could
induce unsafe code generation, leak data, or bypass a runtime sandbox — please report it
privately.

- **Preferred:** open a [GitHub security advisory](https://github.com/agentic-work/agenticwork-skills/security/advisories/new)
  (private disclosure).
- **Email:** security@agenticwork.io

Please include a description, reproduction steps, and the potential impact. Do **not**
open a public issue for a security-sensitive report.

We aim to acknowledge reports within a few business days and will coordinate a fix and
disclosure timeline with you.

## Scope

This repository contains **skills** (instructional Markdown + optional resources/scripts).
The primary risk surface is a skill that steers a model toward unsafe output. Skills here
must assume their output runs in a **hardened sandbox** (opaque-origin iframe, pinned
imports only, no ambient credentials) and must never instruct a model to weaken those
controls.
