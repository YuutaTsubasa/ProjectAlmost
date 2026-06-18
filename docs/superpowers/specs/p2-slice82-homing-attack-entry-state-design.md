# P2 Slice 82: Homing Attack Entry State Rule

## Target Behavior

When `GameplayScene.tryHomingAttack()` has an eligible target, Homing Attack entry currently sets:

- `attackReady: false`
- `attacking: true`
- `homingAttacking: true`

Preserve that behavior by moving the pure entry state into `src/domain/player/homingRules.ts`.

## Boundaries

Domain owns only the Homing Attack entry state values.

Phaser scene still owns all side effects:

- target lookup and assignment
- reticle visibility
- player visual state and texture
- animation stop
- Homing Attack resolution
- collision changes and movement

## TDD Plan

1. Add `getHomingAttackEntryState()` tests in `src/domain/player/homingRules.test.ts`.
2. Run the focused homing test and verify it fails because the function is missing.
3. Implement `getHomingAttackEntryState()` in `src/domain/player/homingRules.ts`.
4. Wire `GameplayScene.tryHomingAttack()` to apply the domain state after a target is found.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `getHomingAttackEntryState()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover the full state shape and fresh object behavior.
- `GameplayScene.tryHomingAttack()` no longer hard-codes those three Homing Attack entry booleans inline.
- No behavior changes to target selection, reticle handling, texture/frame selection, dash resolution, or Homing Attack availability.
