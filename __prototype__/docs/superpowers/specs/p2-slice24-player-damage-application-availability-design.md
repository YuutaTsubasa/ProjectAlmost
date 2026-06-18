# P2 Slice 24: Player Damage Application Availability

## Target Behavior

Extract the final guard from `GameplayScene.applyPlayerHit(sourceX)` into a pure player-domain rule.

The rule answers whether an incoming hit source may actually apply player damage.

Current behavior must be preserved:

- invulnerable player cannot take damage
- already hurting player cannot take damage
- active Homing Attack cannot take damage
- crouching player cannot take damage
- dead player cannot take damage
- otherwise damage may be applied

## Files Expected To Change

- `src/domain/player/hurtRules.ts`
- `src/domain/player/hurtRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure boolean decision.

Phaser scene keeps:

- source position and knockback direction
- health mutation and defeat branch
- SFX, HUD updates, animation, tweens, timers, and collision changes

## TDD Plan

1. Add a failing domain test for `canApplyPlayerDamage`.
2. Implement the minimal pure function.
3. Replace only the guard in `GameplayScene.applyPlayerHit`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Each guard input is necessary and tested independently.
- `hurtPlayer`, `hurtPlayerFromHazard`, and projectile hit routing are not changed in this slice.
- `GameplayScene.applyPlayerHit` becomes an adapter from scene state to domain input before applying side effects.
