# P2 Slice 35: Gameplay HUD Progress

## Target Behavior

Move the gameplay HUD minimap progress calculation out of `GameplayScene` and into a pure domain function.

The scene should still own player coordinates, world dimensions, and HUD event dispatch. The domain layer should only answer how a position maps to a normalized `0..1` progress value.

## Boundary

- Domain: convert `position / worldSize` into a clamped progress value.
- Phaser adapter: read `player.x`, `player.y`, `worldWidth`, and `worldHeight`, then pass them into the domain function.

## Files Expected To Change

- `src/domain/stage/hudProgressRules.ts`
- `src/domain/stage/hudProgressRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Rules

- Preserve existing clamp behavior for normal positive world sizes.
- Values before the world start clamp to `0`.
- Values beyond the world end clamp to `1`.
- Do not change HUD event payload names, minimap rendering, player coordinates, camera behavior, or world dimensions.
- Do not import Phaser, Svelte, DOM, or storage APIs from the domain file.

## Test Cases

- `position: 0, worldSize: 1000 -> 0`
- `position: 250, worldSize: 1000 -> 0.25`
- `position: 1000, worldSize: 1000 -> 1`
- `position: -20, worldSize: 1000 -> 0`
- `position: 1200, worldSize: 1000 -> 1`

## Validation Plan

1. Run the focused HUD progress test and observe RED before implementation.
2. Implement pure progress calculation and wire `GameplayScene`.
3. Run the focused test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
