# P2 Slice 44: Gameplay HUD Platform Marker List

## Target Behavior

Move the gameplay HUD platform marker list construction out of `GameplayScene` and into the pure stage HUD map domain.

The Phaser scene still owns selected stage data and tile/world dimensions. The domain receives structural platform tile data and returns normalized minimap platform markers.

## Domain Rule

`getHudPlatformMarkers(input)` returns:

- An empty list when there are no platforms.
- One marker for each platform, preserving input order.
- Marker coordinates equivalent to `getHudPlatformMarker`.
- Raw normalized values without clamping.

The input is structural and only requires platform `{ col: number; row: number; width: number }` plus `tileColumns`, `tileSize`, and `worldHeight`. The domain must not import Phaser, Svelte, DOM APIs, stage runtime objects, or game scene types.

## Files Expected To Change

- `src/domain/stage/hudMapRules.ts`
- `src/domain/stage/hudMapRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change platform collision, rendering, tile index calculation, or stage JSON.
- Do not clamp marker output; existing HUD projection intentionally preserves raw normalized values.
- Do not move stage runtime state into module-level globals.
- Keep `GameplayScene` as the adapter that passes stage platform data and dimensions into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function, reusing `getHudPlatformMarker`.
3. Wire `GameplayScene` HUD dispatch to call the domain list rule.
4. Run the focused HUD map domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
