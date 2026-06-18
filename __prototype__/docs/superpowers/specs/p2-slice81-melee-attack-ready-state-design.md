# P2 Slice 81: Melee Attack Ready Recovery State Rule

## Target Behavior

`GameplayScene.tryAttack()` schedules a `360ms` delayed callback that currently restores melee attack readiness:

- `attackReady: true`

Preserve that behavior by moving the pure ready recovery state into `src/domain/player/attackRules.ts`.

## Boundaries

Domain owns only the melee attack ready recovery value.

Phaser scene still owns all side effects:

- delayed callback scheduling
- scene field assignment
- melee attack entry and end timing
- visual state reset
- hitbox destruction
- enemy hit detection

## TDD Plan

1. Add `getMeleeAttackReadyState()` tests in `src/domain/player/attackRules.test.ts`.
2. Run the focused attack test and verify it fails because the function is missing.
3. Implement `getMeleeAttackReadyState()` in `src/domain/player/attackRules.ts`.
4. Wire the `360ms` callback in `GameplayScene.tryAttack()` to apply the domain state.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `getMeleeAttackReadyState()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover the state shape and fresh object behavior.
- `GameplayScene.tryAttack()` no longer hard-codes the `360ms` attack readiness boolean inline.
- No behavior changes to attack start, attack end, hitbox lifecycle, visual reset, or timer duration.
