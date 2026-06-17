# P2 Slice 33: Stage Timer Label Format

## Target Behavior

Move the stage timer display formatting out of `GameplayScene` and into a pure domain function.

The gameplay scene should still own timer state, frame delta accumulation, and HUD dispatch side effects. The domain layer should only answer how an elapsed millisecond value is displayed as a timer string.

## Boundary

- Domain: convert elapsed milliseconds into `MM:SS.CS`.
- Phaser adapter: prepend the existing `TIME ` HUD label and pass the current `stageTimeMs`.

## Files Expected To Change

- `src/domain/stage/timerRules.ts`
- `src/domain/stage/timerRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Keep the existing floor-to-centiseconds behavior.
- Preserve the existing `TIME ` prefix at the scene/HUD boundary.
- Do not change timer start/stop rules, delta accumulation, rank inputs, or result timing.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- `0ms -> 00:00.00`
- `9ms -> 00:00.00`
- `10ms -> 00:00.01`
- `999ms -> 00:00.99`
- `1000ms -> 00:01.00`
- `60000ms -> 01:00.00`
- `14830ms -> 00:14.83`

## Validation Plan

1. Run the focused `timerRules` test and observe RED before implementation.
2. Implement the pure formatter and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
