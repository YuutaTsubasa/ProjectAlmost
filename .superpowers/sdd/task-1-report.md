# Task 1: Select Info Presenter

## Status

DONE

## TDD Evidence

1. Added `src/application/select/selectInfoPresenter.test.ts` from the task brief.
2. RED run:
   - Command: `npm run test -- src/application/select/selectInfoPresenter.test.ts`
   - Result: failed as expected because `./selectInfoPresenter` did not exist.
3. Added `src/application/select/selectInfoPresenter.ts` with the smallest implementation required by the tests.
4. GREEN run:
   - Command: `npm run test -- src/application/select/selectInfoPresenter.test.ts`
   - Result: 1 test file passed, 4 tests passed.

## Files Changed

- `src/application/select/selectInfoPresenter.test.ts`
  - Covers world-local cleared counts and progress percentages.
  - Covers selected-world stage projection, progression state, records, and missing progression defaults.
- `src/application/select/selectInfoPresenter.ts`
  - Exposes typed world and stage select view models.
  - Uses a stage-id progression lookup to project catalog data without leaking unrelated progression entries across worlds.
  - Defaults missing stage progression to locked, uncleared, and recordless.

The pre-existing untracked `pnpm-lock.yaml` was not touched.

## Verification

- `npm run test`: passed, 76 test files and 800 tests.
- `npm run check`: passed, 0 Svelte/TypeScript errors and 0 warnings.
- `npm run build`: passed. Vite emitted the existing large-chunk warning after a successful build.
- `git diff --check`: passed.

## Self-Review

- Presenter is pure and deterministic.
- No Svelte, DOM, Tauri, browser storage, timers, random sources, or prototype imports.
- Catalog order and each world’s authored `stageIds` define output order and membership.
- Progress counts require `cleared === true`; missing entries are not counted.
- Stage records are passed through without mutation.
- No unrelated files or refactors were included.

## Concerns

- The production build reports a chunk-size warning, but this is unrelated to Task 1 and does not fail the build.
- No other concerns identified.
