# P2 Slice 62: Player Defeat Outcome Rule

## Target Behavior

Move the pure defeat-reason outcome out of `GameplayScene.defeatPlayer()` and into the player hurt domain.

The behavior must remain unchanged:

- Fall deaths increment the fall counter by `1`.
- Damage deaths do not increment the fall counter.
- Fall deaths set vertical death velocity to `0`.
- Damage deaths set vertical death velocity to `-160 * gravitySign`.
- Fall deaths use status key `status.fall`.
- Damage deaths use status key `status.critical`.

`GameplayScene` remains responsible for all Phaser side effects: sound, health and state mutation, projectile cleanup, collision changes, velocity application, animation, status dispatch, camera fade, and respawn.

## Files Expected To Change

- `src/domain/player/hurtRules.ts`
- `src/domain/player/hurtRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/player/hurtRules.ts` owns pure hurt/defeat decisions.

`GameplayScene.ts` remains the adapter that applies the returned outcome to mutable Phaser runtime state.

## TDD Plan

1. Add focused tests for `getPlayerDefeatOutcome()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function and narrow reason/status types.
4. Wire `GameplayScene.defeatPlayer()` to use the pure outcome.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- Domain function covers both `fall` and `damage` reasons.
- `GameplayScene.defeatPlayer()` no longer branches directly on `reason === 'fall'` for fall count, vertical death velocity, or status key.
- Existing death side effects, timings, animations, and respawn flow are unchanged.
- Verification passes and the slice is committed.
