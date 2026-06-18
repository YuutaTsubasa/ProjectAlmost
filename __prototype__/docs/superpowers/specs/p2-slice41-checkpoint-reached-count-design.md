# P2 Slice 41: Checkpoint Reached Count

## Target Behavior

Move the conversion from active checkpoint index to reached checkpoint count out of `GameplayScene` and into a pure stage domain function.

The scene should still own checkpoint runtime state, checkpoint activation, and HUD/rank dispatch. The domain layer should only answer how many checkpoints have been reached given the current active checkpoint index.

## Boundary

- Domain: calculate `checkpointsReached` from `activeCheckpointIndex`.
- Phaser adapter: pass the current `activeCheckpointIndex` into the domain function for scoring and HUD state.

## Files Expected To Change

- `src/domain/stage/checkpointRules.ts`
- `src/domain/stage/checkpointRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve the existing calculation exactly:
  - `checkpointsReached = activeCheckpointIndex + 1`
- Do not clamp values in this slice.
- Do not change checkpoint detection, checkpoint activation, active checkpoint marker rendering, scoring weights, or HUD event payload names.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- active checkpoint index `-1` means `0` reached checkpoints.
- active checkpoint index `0` means `1` reached checkpoint.
- active checkpoint index `2` means `3` reached checkpoints.

## Validation Plan

1. Run the focused checkpoint rules test and observe RED before implementation.
2. Implement pure reached-count calculation and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
