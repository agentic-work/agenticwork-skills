---
name: cleanroom-auditor
description: >-
  Use when re-expressing a file so it is no longer verbatim-derivative of an
  upstream source while preserving exact behavior — the "cleanroom rework". Use
  before claiming a rewrite is clean, when auditing how close a file still is to
  its reference, or when grading a batch of cleanroom rewrites. Teaches the
  tiered gate (verbatim_pct <=10% target, >30% hard-fail, with an accepted
  pure-logic / cross-file-contract floor), the behavior-preserving discipline
  (parity from how the working path actually behaves, never a guess), and the
  honesty checks that stop a "done" claim from hiding a still-verbatim file.
tags: [cleanroom, audit, refactor, parity, verbatim, quality]
version: 1.0.0
---

# cleanroom-auditor

Re-express a file so it is **functionally identical** to its reference but **not
verbatim-derivative** of it. This is the discipline behind agenticode's cleanroom
rework: parity is proven by behavior (tests, the working path), and the
expression is rewritten fresh.

## The iron rules

1. **Understand before you change.** Read the whole file and every export.
   Derive "correct" from how the code actually behaves (read it, run its tests) —
   never from a guess. If you cannot explain what a function does and why, you do
   not understand it yet — keep reading.
2. **Preserve the contract exactly.** Same public API, same types, same
   observable behavior, same error semantics. Re-express *internals*: structure,
   naming, comment density, control-flow shape, expression — idiomatically, to
   match the surrounding codebase. **Never obfuscate.**
3. **Gate before you claim.** A rewrite is not "clean" until the machine gate
   passes AND its tests are green. Saying "done" without the gate is a lie.

## The tiered gate

Run the verbatim audit (`audit-verbatim.sh <new-file> <reference-file>`, or an
equivalent line-overlap check on *significant* lines — excluding imports,
braces, and other structural noise):

| verbatim_pct | verdict |
|---|---|
| **<= 10%** | PASS — ship it |
| 10–30% | WARN — rewrite more; only ship with a documented floor |
| **> 30%** | HARD FAIL — not cleanroom; do not ship |

**Accepted floors** (residual that is legitimately hard to lower without breaking
the contract — document them, do not obfuscate around them):
- **Pure-logic / algorithmic** lines where any correct implementation converges
  (e.g. a base62 encode, a well-known parse). Cap ~8%.
- **Cross-file contracts**: prop names, wire/protocol keys, disk-format field
  names, JSX/hook shapes that other files depend on — these *must* match, so
  their lines read as "verbatim" and that is correct.

## Procedure

1. Read the file + its reference. Note the public surface and any contract
   floors (exported names, schema keys, prop types).
2. Re-express the implementation: change structure, naming, comments, and
   expression while holding behavior + API constant.
3. Run the verbatim gate against the reference. Iterate until <=10% (or a
   documented floor).
4. **Typecheck the file** (`tsc --noEmit` and grep for the path — zero new
   errors) and **run its tests** (the contract/unit tests for that file must
   stay green). A rewrite that compiles wrong or fails tests is worse than the
   verbatim original.
5. Only then claim clean — and report the before→after percentage as evidence.

## Honesty checks (what stops a false "done")

- **Did the file actually change on disk?** A timed-out or aborted agent may
  leave the original untouched — `git diff --stat` it. "No change" ≠ "clean".
- **Exit code ≠ file state.** A process that exited 0 can still have a
  still-verbatim file; re-run the gate on the *current* file, not the log.
- **One reference is not all references.** If the file derives from multiple
  upstream files, audit against each.
- **Behavior drift is the silent killer.** A 2%-verbatim file that broke a test
  failed. Verbatim-low + tests-green is the bar — both, every time.

## Worked example

Auditing `FileReadTool.ts` (234 lines) against its upstream:
- Baseline: `verbatim_pct=21%` (WARN — 32 of 148 significant lines matched).
- Re-expressed internals (renamed locals, restructured the read/validate flow,
  rewrote comments), preserved the tool's input schema + `call()` return shape.
- After: `verbatim_pct=2%` (4 lines matched — all unavoidable contract lines).
  `tsc --noEmit` clean; `fileReadTool.contract.test.ts` 7/7 green.
- Verdict: PASS. Reported "21% → 2%, tests green" as the evidence.

A counter-example from the same batch: a 1267-line file rewritten under a tight
timeout landed at `verbatim_pct=12%` — still WARN, not done. The honest call was
"partial, do not ship", not "complete".
