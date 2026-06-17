# P2 Slice 28: Moving Platform Position

## Target Behavior

Extract the pure moving-platform position formula from `GameplayScene.updateMovingPlatforms()`.

Current behavior must be preserved:

- default phase is `0`
- oscillation angle is `(nowMs / durationMs + phase) * Math.PI * 2`
- offset is `Math.sin(angle) * distance`
- `axis: "x"` applies the offset to `startX` only
- `axis: "y"` applies the offset to `startY` only

## Files Expected To Change

- `src/domain/world/movingPlatformRules.ts`
- `src/domain/world/movingPlatformRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure platform position calculation.

Phaser scene keeps:

- iterating runtime platform sprites
- rider detection
- velocity calculation from previous position and delta time
- sprite/body position mutation
- carrying the player along with platform delta

## TDD Plan

1. Add a failing domain test for `getMovingPlatformPosition`.
2. Implement the minimal pure function.
3. Replace only the position formula inside `GameplayScene.updateMovingPlatforms`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Preserve exact formula and default phase behavior.
- No riding, velocity, body update, or stage-data behavior changes in this slice.
