# Project Workflow

Use this workflow for every future feature.

## 1. Understand

- Read `AGENTS.md`.
- Read the relevant docs in `docs/`.
- Inspect `__prototype__/` only as reference.
- Identify touched layers: domain, application, UI, Tauri, assets, docs.

## 2. Specify

Create or update a spec in `docs/superpowers/specs/`.

The spec must include:

- target behavior
- layer ownership
- files expected to change
- side effects and adapters
- tests to write first
- validation commands
- out-of-scope items

## 3. TDD

For behavior changes:

1. Write a focused failing test.
2. Run it and confirm the expected failure.
3. Implement the smallest passing code.
4. Run the focused test again.
5. Refactor only while tests stay green.

## 4. Wire Adapters

Connect Svelte, Tauri, or future rendering code only after the domain/application behavior is tested.

Adapters may mutate UI, files, windows, audio, or render state. Domain code may not.

## 5. Verify

Run checks matching the change:

- `npm run test`
- `npm run check`
- `npm run build`
- `cargo check --manifest-path src-tauri/Cargo.toml` for Rust/Tauri changes when dependencies are available
- `git diff --check`

## 6. Commit

Keep commits scoped and named by behavior or architectural step.

Do not combine prototype movement, architecture docs, and gameplay features in the same commit unless the user explicitly asks.
