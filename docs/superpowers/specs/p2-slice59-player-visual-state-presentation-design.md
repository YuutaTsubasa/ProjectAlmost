# P2 Slice 59: Player Visual State Presentation Rule

## Target Behavior

Move the pure `normal` / `attack` player visual presentation choice out of `GameplayScene.setPlayerVisualState()` and into the player domain.

The behavior must remain unchanged:

- `normal` visual state uses the normal player scale and visual Y offset `0`.
- `attack` visual state uses the attack scale and attack visual Y offset.
- `GameplayScene` remains responsible for Phaser side effects: setting sprite scale, adjusting `player.y`, updating `playerVisualYOffset`, and resetting the Arcade body size/offset.

## Files Expected To Change

- `src/domain/player/animationRules.ts`
- `src/domain/player/animationRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/player/animationRules.ts` owns pure player animation and presentation decisions.

`GameplayScene.ts` remains the Phaser adapter and must not move sprite/body mutation into the domain.

## TDD Plan

1. Add tests for `getPlayerVisualStatePresentation()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function and type.
4. Wire `GameplayScene.setPlayerVisualState()` to the pure rule.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function returns `{ scale, visualOffsetY }` for `normal` and `attack`.
- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- `GameplayScene.setPlayerVisualState()` no longer branches on visual state directly for scale/offset.
- Player body size/offset, crouch behavior, animation playback, and visual constants are unchanged.
- Verification passes and the slice is committed.
