# P2 Slice 66: Homing Finish Outcome Rule

## Target Behavior

Move the pure Homing Attack finish outcome decision out of `GameplayScene.finishHomingAttack()` and into the Homing domain.

The behavior must remain unchanged:

- A successful Homing hit resets remaining air jumps to `1`.
- A successful Homing hit sets vertical velocity to `HOMING_ATTACK_BOUNCE_Y * gravitySign`.
- A successful Homing hit uses status key `status.homingHit`.
- A missed Homing attack does not reset remaining air jumps.
- A missed Homing attack sets vertical velocity to `0`.
- A missed Homing attack uses status key `status.homingMiss`.

`GameplayScene` remains responsible for Phaser velocity application, mutable player state, status dispatch, delayed recovery, and attack readiness side effects.

## Files Expected To Change

- `src/domain/player/homingRules.ts`
- `src/domain/player/homingRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/player/homingRules.ts` owns pure Homing Attack decisions.

`GameplayScene.ts` remains the Phaser adapter that applies the returned outcome to runtime state.

## TDD Plan

1. Add focused tests for `getHomingFinishOutcome()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function and constant in the Homing domain.
4. Wire `GameplayScene.finishHomingAttack()` to use the pure outcome.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- Domain function covers hit and miss outcomes.
- `GameplayScene.finishHomingAttack()` no longer branches directly on `hit`.
- Delayed recovery and attack-ready side effects remain unchanged.
- Verification passes and the slice is committed.
