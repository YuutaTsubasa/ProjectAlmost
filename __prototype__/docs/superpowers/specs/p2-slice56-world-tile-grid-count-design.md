# P2 Slice 56: World Tile Grid Count

## Target Behavior

Move world tile column and row count calculations out of `GameplayScene` and into the pure world terrain domain.

The Phaser scene still owns tilemap creation, stage dimensions, and rendering. The domain receives world dimensions plus tile size and returns the grid counts currently used by the scene.

## Domain Rule

`getTileColumnCount(input)` returns:

- `worldWidth / tileSize`

`getTileRowCount(input)` returns:

- `Math.ceil(worldHeight / tileSize)`

This preserves the current behavior where columns may be fractional if the stage width is not divisible by tile size, while rows are rounded up.

## Files Expected To Change

- `src/domain/world/terrainRules.ts`
- `src/domain/world/terrainRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change tilemap creation, tile size, stage dimensions, or terrain tile indexing.
- Do not introduce Phaser or stage schema imports into the domain.
- Keep `GameplayScene` as the adapter that passes selected stage world dimensions into the pure rules.

## Validation Plan

1. Add domain tests first and verify the missing functions fail.
2. Implement the minimal pure functions.
3. Wire `GameplayScene.tileColumns` and `GameplayScene.tileRows` to call the domain rules.
4. Run the focused terrain domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
