# P2 Slice 30: Platform Tile Index

## Target Behavior

Extract the pure platform tile-index decision from `GameplayScene.getPlatformTileIndex(index, width)`.

Current behavior must be preserved:

- width `1` uses middle tile index `1`
- first tile in wider platforms uses left tile index `0`
- last tile in wider platforms uses right tile index `2`
- all other tiles use middle tile index `1`

## Files Expected To Change

- `src/domain/world/terrainRules.ts`
- `src/domain/world/terrainRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure tile index decision.

Phaser scene keeps:

- tilemap data array creation
- platform rectangle iteration
- writing tile indices into terrain data

## TDD Plan

1. Add a failing domain test for `getPlatformTileIndex`.
2. Implement the minimal pure function.
3. Replace the private `GameplayScene.getPlatformTileIndex` helper with the domain function.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Preserve the exact tile index values `0`, `1`, and `2`.
- No terrain dimensions, tilemap creation, or stage data behavior changes in this slice.
