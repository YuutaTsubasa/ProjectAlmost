# P2 Slice 77: Stage Completion Eligibility Rule

## Target Behavior

`GameplayScene.completeStage()` currently returns immediately when the stage is already cleared. Preserve that behavior by moving the pure eligibility check into `src/domain/stage/stageClearRules.ts`.

The rule is:

- a stage can complete when `stageCleared` is `false`
- a stage cannot complete when `stageCleared` is `true`

## Boundaries

Domain owns only the boolean decision.

Phaser scene still owns all side effects:

- goal SFX
- clear state assignment through `getStageClearState()`
- Homing reticle visibility
- player and enemy velocity changes
- goal tint
- status/HUD dispatch
- player visual state and animation

## TDD Plan

1. Add `canCompleteStage()` tests in `src/domain/stage/stageClearRules.test.ts`.
2. Run the focused stage clear test and verify it fails because the function is missing.
3. Implement `canCompleteStage()` in `src/domain/stage/stageClearRules.ts`.
4. Wire `GameplayScene.completeStage()` to use `canCompleteStage({ stageCleared: this.stageCleared })`.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `canCompleteStage()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover both eligible and already-cleared cases.
- `GameplayScene.completeStage()` no longer directly checks `this.stageCleared` for the early return.
- No behavior changes to clear side effects or clear state transition values.
