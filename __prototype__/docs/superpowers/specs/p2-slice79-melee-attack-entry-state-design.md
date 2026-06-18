# P2 Slice 79: Melee Attack Entry State Rule

## Target Behavior

When `GameplayScene.tryAttack()` passes `canStartMeleeAttack()`, melee attack entry currently sets:

- `attackReady: false`
- `attacking: true`

Preserve that behavior by moving the pure entry state into `src/domain/player/attackRules.ts`.

## Boundaries

Domain owns only the melee entry state values.

Phaser scene still owns all side effects:

- SFX dispatch
- footstep timing
- visual state and player animation
- hitbox creation, placement, visibility, and destruction
- enemy hit detection and defeat
- delayed callbacks for recovery and readiness

## TDD Plan

1. Add `getMeleeAttackEntryState()` tests in `src/domain/player/attackRules.test.ts`.
2. Run the focused attack test and verify it fails because the function is missing.
3. Implement `getMeleeAttackEntryState()` in `src/domain/player/attackRules.ts`.
4. Wire `GameplayScene.tryAttack()` to apply the domain state after the start guard passes.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `getMeleeAttackEntryState()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover the full state shape and fresh object behavior.
- `GameplayScene.tryAttack()` no longer hard-codes melee entry boolean values inline.
- No behavior changes to melee availability, hitbox geometry, hit detection, animation, SFX, or recovery timers.
