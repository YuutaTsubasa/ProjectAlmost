# Project Almost Rebuild

This is the new Tauri v2 + Svelte rebuild of Project Almost.

The old playable prototype has been moved to `__prototype__/`. It remains useful as a design reference, asset source, and behavior reference, but the rebuild should not import runtime code from it.

## Step 0 State

Current rebuild scope:

- Tauri v2 desktop shell under `src-tauri/`
- Svelte + Vite frontend under `src/`
- Vitest test harness for pure TypeScript domain rules
- Project workflow guardrails in `AGENTS.md`
- Architecture and implementation workflow documents under `docs/`

## Scripts

```bash
npm run dev
npm run test
npm run check
npm run build
npm run tauri:dev
```

## Architecture Target

```text
src/domain/
  Pure Functional domain core.

src/application/
  Use cases, commands, route/state models, and view-model shaping.

src/ui/ and Svelte components
  Reactive presentation layer.

src-tauri/
  Tauri v2 shell and explicit native adapters.

__prototype__/
  Frozen reference implementation.
```

The long-term direction is Functional + Reactive foundations, organized with DDD boundaries and thin OOP/application service adapters where useful.

## Development Rule

Every feature should start with a spec and TDD. Do not port prototype code directly into the rebuild without first defining the intended domain or application boundary.
