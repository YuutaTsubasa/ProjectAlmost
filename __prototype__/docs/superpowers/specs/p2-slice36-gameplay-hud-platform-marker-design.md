# P2 Slice 36: Gameplay HUD Platform Marker Projection

## Target Behavior

Move the gameplay HUD mini-map platform marker projection out of `GameplayScene` and into a pure domain function.

The scene should still own stage data, tile dimensions, world dimensions, and HUD event dispatch. The domain layer should only answer how a stage platform rectangle projects into normalized mini-map line data.

## Boundary

- Domain: convert a platform's tile-space `col`, `row`, and `width` into normalized mini-map `x`, `y`, and `width`.
- Phaser adapter: map the current stage platforms through the domain function before dispatching the HUD event.

## Files Expected To Change

- `src/domain/stage/hudMapRules.ts`
- `src/domain/stage/hudMapRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve the existing projection exactly:
  - `x = platform.col / tileColumns`
  - `y = (platform.row * tileSize) / worldHeight`
  - `width = platform.width / tileColumns`
- Do not clamp platform markers in this slice.
- Do not change HUD event payload names, mini-map rendering, stage platform data, tile dimensions, or world dimensions.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- platform at `col: 0`, `row: 0`, `width: 4` in `tileColumns: 100` projects to `x: 0`, `y: 0`, `width: 0.04`.
- platform at `col: 25`, `row: 5`, `width: 10`, `tileSize: 48`, `tileColumns: 100`, `worldHeight: 960` projects to `x: 0.25`, `y: 0.25`, `width: 0.1`.
- platform at the right edge keeps the existing raw normalized math without additional clamping.

## Validation Plan

1. Run the focused HUD map rule test and observe RED before implementation.
2. Implement pure marker projection and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
