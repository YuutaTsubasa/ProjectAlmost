# Project Almost Rebuild Agent Guide

Read this file before changing code in the rebuilt project. The previous playable prototype is preserved under `__prototype__/` as a reference only.

## Required Workflow

Every implementation task must follow the superpowers workflow:

1. Read the relevant skill files before acting, especially `using-superpowers`.
2. For new behavior or refactors, write or update a spec in `docs/superpowers/specs/`.
3. Use TDD for domain or application behavior:
   - write the failing test first
   - run it and confirm the expected failure
   - implement the smallest code that passes
   - run focused and full verification
4. Keep changes small enough to review and commit independently.

Do not skip TDD because the change feels small. If the change is not testable, first improve the boundary until it is.

## Architecture Direction

The rebuild uses these layers:

- `src/domain/`: pure Functional core. No Svelte, Tauri, DOM, Phaser, browser storage, timers, or random side effects.
- `src/application/`: use cases and reactive state models. Coordinates domain rules and exposes view models or commands.
- `src/ui/` and Svelte components: Reactive presentation. Components render state and emit user intents.
- `src-tauri/`: Tauri v2 desktop adapter. Rust commands must stay thin and explicit.
- `__prototype__/`: historical playable prototype and asset/design reference. Do not import runtime code from it.

OOP is allowed as a DDD organization tool for domain concepts and application services, but behavior should remain deterministic and testable. Prefer pure functions, immutable values, discriminated unions, and explicit commands/events.

## Prototype Boundary

Use `__prototype__/` for:

- checking previous gameplay behavior
- reviewing assets, generated art, stage JSON, and UI references
- comparing old architecture decisions

Do not:

- add new source files inside `__prototype__/` unless explicitly maintaining the old prototype
- import from `__prototype__/src`
- treat prototype code as the new architecture

## Required Checks

Before finishing a task, run the smallest relevant checks:

- Domain/application changes: `npm run test`
- Svelte/TypeScript changes: `npm run check`
- Build/config/Tauri frontend changes: `npm run build`
- Tauri Rust changes: `cargo check --manifest-path src-tauri/Cargo.toml` when dependencies are available
- Whitespace/path sanity: `git diff --check`

Report any check that could not be run and why.

## File Ownership Rules

- Runtime assets for the rebuild will live under root-level `public/` or a future documented asset package, not under `__prototype__/public/`.
- Visible text must be prepared for future localization; avoid hard-coded gameplay UI copy once UI systems begin.
- Route, save, audio, stage, and gameplay systems need specs before implementation.
- Keep root documentation current when the architecture changes.
