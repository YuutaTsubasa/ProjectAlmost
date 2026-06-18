# P2 Slice 39: Gameplay HUD Goal Progress Projection

## Target Behavior

Move the gameplay HUD mini-map goal progress calculation out of `GameplayScene` and into a pure domain function.

The scene should still own stage goal data, world dimensions, and HUD event dispatch. The domain layer should only answer how the goal x-coordinate maps into the mini-map progress value.

## Boundary

- Domain: convert `goalX / worldWidth` into the existing raw normalized progress value.
- Phaser adapter: pass the current stage goal x-coordinate and world width into the domain function.

## Files Expected To Change

- `src/domain/stage/hudMapRules.ts`
- `src/domain/stage/hudMapRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve the existing projection exactly:
  - `goalProgress = goalX / worldWidth`
- Do not clamp goal progress in this slice.
- Do not change HUD event payload names, mini-map rendering, goal placement, stage data, or world dimensions.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- goal at `x: 0` in a `1000` width world projects to `0`.
- goal at `x: 250` in a `1000` width world projects to `0.25`.
- goal beyond the world end keeps the existing raw normalized math without additional clamping.

## Validation Plan

1. Run the focused HUD map rule test and observe RED before implementation.
2. Implement pure goal progress projection and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
