# P2 Slice 80: Melee Attack End State Rule

## Target Behavior

`GameplayScene.tryAttack()` schedules a `340ms` delayed callback that currently ends the melee attack visual/action state:

- `attacking: false`

Preserve that behavior by moving the pure end state into `src/domain/player/attackRules.ts`.

## Boundaries

Domain owns only the melee attack end state value.

Phaser scene still owns all side effects:

- delayed callback scheduling
- scene field assignment
- visual state reset through `setPlayerVisualState('normal')`
- hitbox destruction
- attack readiness recovery at `360ms`

## TDD Plan

1. Add `getMeleeAttackEndState()` tests in `src/domain/player/attackRules.test.ts`.
2. Run the focused attack test and verify it fails because the function is missing.
3. Implement `getMeleeAttackEndState()` in `src/domain/player/attackRules.ts`.
4. Wire the `340ms` callback in `GameplayScene.tryAttack()` to apply the domain state.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `getMeleeAttackEndState()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover the state shape and fresh object behavior.
- `GameplayScene.tryAttack()` no longer hard-codes the `340ms` attack end boolean inline.
- No behavior changes to hitbox destruction, visual reset, or attack readiness timing.
