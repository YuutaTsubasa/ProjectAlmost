# P2 Slice 22: Player Enemy Hurt Availability

## Target Behavior

Extract the first-layer guard from `GameplayScene.hurtPlayer(enemy)` into a pure player-domain rule.

The rule answers whether an enemy contact is allowed to proceed into `applyPlayerHit(enemy.x)`.

Current behavior must be preserved:

- invulnerable player ignores enemy contact
- already hurting player ignores enemy contact
- defeated enemy ignores contact
- active Homing Attack ignores contact
- dead player ignores contact
- otherwise enemy contact may call `applyPlayerHit`

## Files Expected To Change

- `src/domain/player/hurtRules.ts`
- `src/domain/player/hurtRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure boolean decision.

Phaser scene keeps:

- `isEnemyDefeated(enemy)` sprite/runtime lookup
- reading `enemy.x`
- calling `applyPlayerHit`
- all damage, health, animation, invulnerability, SFX, and respawn side effects

## TDD Plan

1. Add a failing domain test for `canApplyPlayerEnemyHit`.
2. Implement the minimal pure function.
3. Replace only the enemy-contact guard in `GameplayScene.hurtPlayer`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Each guard input is necessary and tested independently.
- `hurtPlayerFromHazard` and `applyPlayerHit` behavior are not changed in this slice.
- `GameplayScene.hurtPlayer` becomes an adapter from scene state to domain input.
