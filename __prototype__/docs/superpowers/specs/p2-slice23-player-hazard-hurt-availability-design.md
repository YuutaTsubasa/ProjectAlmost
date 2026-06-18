# P2 Slice 23: Player Hazard Hurt Availability

## Target Behavior

Extract the first-layer guard from `GameplayScene.hurtPlayerFromHazard(sourceX)` into a pure player-domain rule.

The rule answers whether hazard contact is allowed to proceed into `applyPlayerHit(sourceX)`.

Current behavior must be preserved:

- invulnerable player ignores hazard contact
- already hurting player ignores hazard contact
- active Homing Attack ignores hazard contact
- dead player ignores hazard contact
- cleared stage ignores hazard contact
- otherwise hazard contact may call `applyPlayerHit`

## Files Expected To Change

- `src/domain/player/hurtRules.ts`
- `src/domain/player/hurtRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure boolean decision.

Phaser scene keeps:

- reading `sourceX`
- calling `applyPlayerHit`
- all damage, health, animation, invulnerability, SFX, and respawn side effects

## TDD Plan

1. Add a failing domain test for `canApplyPlayerHazardHit`.
2. Implement the minimal pure function.
3. Replace only the hazard-contact guard in `GameplayScene.hurtPlayerFromHazard`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Each guard input is necessary and tested independently.
- `hurtPlayer`, `applyPlayerHit`, and hazard collision wiring are not changed in this slice.
- `GameplayScene.hurtPlayerFromHazard` becomes an adapter from scene state to domain input.
