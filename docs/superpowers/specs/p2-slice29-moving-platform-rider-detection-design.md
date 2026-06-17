# P2 Slice 29: Moving Platform Rider Detection

## Target Behavior

Extract the pure rider-detection geometry from `GameplayScene.isPlayerRidingMovingPlatform(platform)`.

Current behavior must be preserved:

- player can only ride moving platforms while player gravity is down
- horizontal overlap requires `playerRight > platformLeft + 8`
- horizontal overlap requires `playerLeft < platformRight - 8`
- close-to-top is `Math.abs(playerBottom - platformTop) <= 12`
- player is riding when horizontally overlapping and either close to the platform top, touching down, or blocked down

## Files Expected To Change

- `src/domain/world/movingPlatformRules.ts`
- `src/domain/world/movingPlatformRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure rider geometry decision.

Phaser scene keeps:

- reading Arcade body edges
- checking sprite/body existence
- reading player gravity direction
- applying carried-player movement and body updates

## TDD Plan

1. Add a failing domain test for `isMovingPlatformRider`.
2. Implement the minimal pure function.
3. Replace only the geometry expression inside `GameplayScene.isPlayerRidingMovingPlatform`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Preserve strict horizontal comparisons and inclusive top tolerance.
- No velocity, platform position, body update, or carried-player movement behavior changes in this slice.
