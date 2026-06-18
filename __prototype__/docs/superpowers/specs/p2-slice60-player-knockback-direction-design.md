# P2 Slice 60: Player Knockback Direction Rule

## Target Behavior

Move the player damage knockback direction decision out of `GameplayScene.applyPlayerHit()` and into the player hurt domain.

The behavior must remain unchanged:

- If the player is left of the damage source, knock the player left with direction `-1`.
- If the player is at the same X position as the damage source, knock the player right with direction `1`.
- If the player is right of the damage source, knock the player right with direction `1`.

`GameplayScene` remains responsible for applying Phaser velocity and for all damage side effects.

## Files Expected To Change

- `src/domain/player/hurtRules.ts`
- `src/domain/player/hurtRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/player/hurtRules.ts` owns pure player hurt and damage decisions.

`GameplayScene.ts` remains the Phaser adapter for health mutation, sound, animation, status messages, tweens, timers, and velocity application.

## TDD Plan

1. Add focused tests for `getPlayerKnockbackDirection()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function.
4. Wire `GameplayScene.applyPlayerHit()` to the pure rule.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function returns only `-1` or `1`.
- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- `GameplayScene.applyPlayerHit()` no longer performs the inline X comparison for knockback direction.
- Damage side effects and knockback velocity magnitude are unchanged.
- Verification passes and the slice is committed.
