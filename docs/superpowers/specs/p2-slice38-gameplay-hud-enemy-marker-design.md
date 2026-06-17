# P2 Slice 38: Gameplay HUD Enemy Marker Projection

## Target Behavior

Move the gameplay HUD mini-map enemy marker coordinate projection out of `GameplayScene` and into a pure domain function.

The scene should still own enemy runtime state, defeated filtering, sprite coordinates, world dimensions, and HUD event dispatch. The domain layer should only answer how an enemy coordinate projects into normalized mini-map marker data.

## Boundary

- Domain: convert enemy `x` and `y` into normalized mini-map marker `x` and `y`.
- Phaser adapter: keep filtering active runtime enemies and pass sprite coordinates into the domain function.

## Files Expected To Change

- `src/domain/stage/hudMapRules.ts`
- `src/domain/stage/hudMapRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve the existing projection exactly:
  - `x = enemyX / worldWidth`
  - `y = enemyY / worldHeight`
- Do not clamp enemy markers in this slice.
- Do not move defeated filtering into domain in this slice.
- Do not change HUD event payload names, mini-map rendering, enemy lifecycle, or world dimensions.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- enemy at `x: 0`, `y: 0` in a `1000x500` world projects to `x: 0`, `y: 0`.
- enemy at `x: 250`, `y: 125` in a `1000x500` world projects to `x: 0.25`, `y: 0.25`.
- enemy beyond the world end keeps the existing raw normalized math without additional clamping.

## Validation Plan

1. Run the focused HUD map rule test and observe RED before implementation.
2. Implement pure enemy marker projection and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
