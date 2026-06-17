# P2 Slice 37: Gameplay HUD Checkpoint Marker Projection

## Target Behavior

Move the gameplay HUD mini-map checkpoint marker projection out of `GameplayScene` and into a pure domain function.

The scene should still own stage checkpoint data, world dimensions, active checkpoint state, and HUD event dispatch. The domain layer should only answer how a checkpoint position projects into normalized mini-map marker data.

## Boundary

- Domain: convert checkpoint `x` and `surfaceY` into normalized mini-map `x` and `y`.
- Phaser adapter: map the current stage checkpoints through the domain function before dispatching the HUD event.

## Files Expected To Change

- `src/domain/stage/hudMapRules.ts`
- `src/domain/stage/hudMapRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve the existing projection exactly:
  - `x = checkpoint.x / worldWidth`
  - `y = checkpoint.surfaceY / worldHeight`
- Do not clamp checkpoint markers in this slice.
- Do not change HUD event payload names, mini-map rendering, checkpoint activation logic, stage checkpoint data, or world dimensions.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- checkpoint at `x: 0`, `surfaceY: 0` in a `1000x500` world projects to `x: 0`, `y: 0`.
- checkpoint at `x: 250`, `surfaceY: 125` in a `1000x500` world projects to `x: 0.25`, `y: 0.25`.
- checkpoint beyond the world end keeps the existing raw normalized math without additional clamping.

## Validation Plan

1. Run the focused HUD map rule test and observe RED before implementation.
2. Implement pure checkpoint marker projection and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
