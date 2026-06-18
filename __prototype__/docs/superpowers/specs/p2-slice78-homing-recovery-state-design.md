# P2 Slice 78: Homing Attack Recovery State Rule

## Target Behavior

`GameplayScene.finishHomingAttack()` schedules a recovery callback after `HOMING_ATTACK_RECOVERY_MS`.

Current behavior:

- `isAttacking` is always set to `false`
- `attackReady` is set to `true` only when the player is not hurting
- when the player is hurting, `attackReady` is not overwritten

Preserve that behavior by moving the pure recovery state decision into `src/domain/player/homingRules.ts`.

## Boundaries

Domain owns only the recovery state values.

Phaser scene still owns all side effects:

- delayed callback scheduling
- scene field assignment
- Homing collision reset
- target clearing
- velocity
- hit/miss status messages
- air jump reset from `getHomingFinishOutcome()`

## TDD Plan

1. Add `getHomingRecoveryState()` tests in `src/domain/player/homingRules.test.ts`.
2. Run the focused homing test and verify it fails because the function is missing.
3. Implement `getHomingRecoveryState()` in `src/domain/player/homingRules.ts`.
4. Wire `GameplayScene.finishHomingAttack()` delayed callback to use the domain state.
5. Run focused tests, full tests, `npm run check`, `git diff --check`, and `npm run build`.

## Definition Of Done

- `getHomingRecoveryState()` is pure and does not import game, Phaser, Svelte, DOM, or browser APIs.
- Tests cover both not-hurting and hurting cases.
- Hurting recovery intentionally omits `attackReady` so the scene can preserve its current value.
- `GameplayScene.finishHomingAttack()` no longer hard-codes the `!this.isHurting` recovery guard.
- No behavior changes to Homing Attack hit/miss outcome, collision, target clearing, velocity, or timer duration.
