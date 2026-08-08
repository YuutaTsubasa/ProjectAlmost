---
name: reviewing-code
description: Use when reviewing code changes for engineering-principle conformance — before committing, before opening or updating a PR, or when asked to review a diff, branch, files, or a GitHub PR. Covers TDD, DDD, functional-core, reactive UI, and 16 code-quality principles.
---

# Reviewing Code

## Overview
Judge changes against this project's engineering principles and report a **structured, verified verdict** — not ad-hoc impressions. Stack: a Svelte 5 (runes) + Phaser game with a layered functional core — `src/domain` (pure), `src/application` (use cases / reactive state), `src/ui` (presentation). Every review applies the TDD / DDD / functional / reactive lenses **and** the 16 principles.

## When to use
- Before committing, or before opening/updating a PR (self-review).
- When asked to "review" a diff, branch, files, or a GitHub PR.
- After finishing a feature or refactor, before claiming it's done.

## 1. Resolve the target
Unless the user names files or a PR, review the **local branch changes** vs `main`:
```bash
git diff --stat main...HEAD   # committed on this branch
git status --short            # uncommitted
git diff main...HEAD; git diff # the diffs to actually read
```
GitHub PR: `gh pr diff <n>`, `gh pr view <n> --json reviews`. **Read only changed lines + enough surrounding context to judge them** — never review whole untouched files.

## 2. Scope out noise
Skip generated/data catalogs (large stage-data files), `__prototype__/`, lockfiles. Judge literals inside declarative data tables leniently. **Include tests** — TDD conformance is part of the review.

## 3. Apply the lenses
- **TDD** — is the behavior pinned by a test written to specify it? Domain/application logic with no test (or a test that only asserts today's constant, so a hard-coded regression still passes) is a finding. Whitebox source-scrape tests count for wiring.
- **DDD** — right layer? `domain` stays pure (no Svelte/DOM/Phaser/timers/IO/storage). `application` coordinates; `ui` only renders and emits intents.
- **Functional core** — pure functions, immutable values, discriminated unions, explicit commands/events; side effects at the edges.
- **Reactive** — derive, don't hand-sync. `$derived` over an `$effect` that only assigns; one source of truth.

## 4. The 16 principles — flag when / exempt when
| # | Principle | Flag when… | Exempt when… |
|---|-----------|-----------|--------------|
| 1 | No redundant comments | comment restates code; commented-out dead code | explains a non-obvious WHY |
| 2 | Named fn over comment | `// do X` heads an inline block | — |
| 3 | No redundant state/wrapper | pass-through getter; `$state` mirroring a value; unused return value | — |
| 4 | No magic numbers/strings | unexplained literal in logic | idiomatic 0/1/-1; declarative data catalog |
| 5 | Constants out of functions | const table/regex/object rebuilt per call | value depends on args |
| 6 | Shared constants/protocol | same literal or union duplicated across modules | already a shared compiler-checked type |
| 7 | Visually delimit begin/end scopes | scope open/close not visually clear — brace-less body on next line; `case` decls without a block | consistent single-line guards |
| 8 | Declarative collections | empty array + push loop; sum/find/map-shaped loop | per-frame hot path (note the tradeoff); index-coupled |
| 9 | const & inference | `let` never reassigned; redundant obvious annotation | annotation adds real safety/intent |
| 10 | Early returns / guards | nested `if` pyramid; `else` after a `return` | — |
| 11 | Expressions / lookup tables | if/switch that only maps input→value | branches with distinct side effects (that's #12) |
| 12 | Exhaustive unions | `.type`/`.kind` dispatch with no `never` default; `\| string` widening a union; boolean soup | — |
| 13 | Derived state / events | `$effect` that only assigns to other state; two states synced by hand | intentional edge-latch / event push |
| 14 | async/await, non-blocking | `.then` chains; floating promise with no `void`/intent; blocking wait | fire-and-forget marked `void` with contained errors |
| 15 | Explicit state, immutability, ownership | mutating inputs or domain values; exported mutable singleton; boolean soup vs a union | quarantined per-frame perf mutation (note it) |
| 16 | Make invalid states unrepresentable | type permits an illegal value/combo — out-of-range primitive (`percentOff: number`), contradictory flags, `as`-cast raw input — with the invariant enforced only ad hoc at call sites | invariant genuinely inexpressible in the type system → then validate once at the boundary (parse-don't-validate) and pass a branded/narrowed type onward |

## 5. Verify, then report
- **Verify every finding against the actual code** before reporting — no speculation. Prefer a missed nit over a false alarm.
- Separate **must-fix** (bug, wrong layer, broken invariant) from **nits**.
- When a principle conflicts with correctness or a hot-path's performance, **say so and pick** — don't demand a fix that makes the code worse.
- Note genuine **strengths** so they're preserved.

## Output format
1. One-line overall verdict.
2. Per-principle table: 🟢 good / 🟡 minor / 🟠 needs work / ⚪ n/a, each with a one-line note.
3. Ranked findings **A, B, C…** (most valuable first): `path:line` · principle# · one-line problem · concrete fix.
4. Strengths worth keeping.

## Common mistakes
- Reviewing whole files instead of the diff → noise. Review changed lines + context.
- Over-flagging: a declarative rewrite in a per-frame loop, or a "magic number" inside a data catalog. Respect the exemptions column.
- Listing principle names with no located, fixable finding (`path:line` + fix).
- Rubber-stamping, or the opposite — demanding a change that trades correctness/perf for a principle. Flag the tradeoff instead.
- Dropping the TDD/DDD/reactive lenses because "the 16 are the checklist." All lenses apply.
- Treating #16 as a duplicate of #12/#15: its distinct job is enforcing invariants at the *type boundary* (branded types, smart constructors, parse-don't-validate) so an illegal value can't be constructed — not just "use a union."
