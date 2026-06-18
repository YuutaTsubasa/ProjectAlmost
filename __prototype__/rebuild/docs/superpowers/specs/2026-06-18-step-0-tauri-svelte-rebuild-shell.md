# Step 0: Tauri v2 + Svelte Rebuild Shell

## Target Behavior

Create a new empty Project Almost rebuild at the repository root while preserving the old playable prototype under `__prototype__/`.

The new root project must provide:

- Tauri v2 shell configuration
- Svelte + Vite frontend
- TypeScript and Svelte checks
- Vitest test harness
- Root documentation that enforces superpowers + TDD + DDD workflow
- Architecture direction based on Functional core and Reactive UI/application state

## Prototype Boundary

`__prototype__/` is a reference implementation. It may be read for design and behavior, but rebuild runtime code must not import from it.

## Initial Domain Test

Add a tiny pure domain identity rule to prove the test harness:

- product name is `Project Almost`
- shell is `tauri-v2`
- UI is `svelte`
- domain core is `functional`
- state model is `reactive`

## Validation

- Focused RED/GREEN test for `src/domain/app/projectIdentity.test.ts`
- `npm run test`
- `npm run check`
- `npm run build`
- `cargo check --manifest-path src-tauri/Cargo.toml` if Rust dependencies can be fetched
- `git diff --check`

## Out Of Scope

- No gameplay implementation.
- No Phaser integration.
- No asset migration.
- No route system beyond the placeholder shell.
- No save data, audio, stage, or input systems.
