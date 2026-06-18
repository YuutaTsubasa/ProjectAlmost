# P2 Slice 40: Boss HUD Phase Display

## Target Behavior

Move the boss phase HUD display calculation out of `GameplayScene` and into a pure boss domain function.

The scene should still own boss runtime state, boss-stage detection, and HUD event dispatch. The domain layer should only answer the display values for the current boss phase indicator.

## Boundary

- Domain: calculate `{ phase, max }` for HUD display.
- Phaser adapter: pass `isBossStage`, current `bossPhase`, and phase count into the domain function.

## Files Expected To Change

- `src/domain/boss/bossRules.ts`
- `src/domain/boss/bossRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve the existing display behavior exactly:
  - non-boss stages display `phase: 0`, `max: 0`
  - boss stages display `phase: Math.min(bossPhase + 1, phaseCount)`
  - boss stages display `max: phaseCount`
- Do not change boss phase transition, boss defeat, boss pattern cadence, reset behavior, or HUD event payload names.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- non-boss stage returns `{ phase: 0, max: 0 }`
- boss phase `0` with phase count `4` returns `{ phase: 1, max: 4 }`
- boss phase `3` with phase count `4` returns `{ phase: 4, max: 4 }`
- boss phase `4` with phase count `4` remains capped at `{ phase: 4, max: 4 }`
- explicit phase count override is supported

## Validation Plan

1. Run the focused boss rules test and observe RED before implementation.
2. Implement pure boss HUD phase display and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
