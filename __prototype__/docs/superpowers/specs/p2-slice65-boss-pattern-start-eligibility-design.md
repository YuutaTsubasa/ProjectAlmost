# P2 Slice 65: Boss Pattern Start Eligibility Rule

## Target Behavior

Move the pure boss-pattern start guard out of `GameplayScene.startBossPattern()` and into the boss domain.

The behavior must remain unchanged:

- A missing boss prototype cannot start a boss pattern.
- A boss prototype whose type is not `azure-core` cannot start a boss pattern.
- A cleared stage cannot start a boss pattern.
- A boss pattern can start only while `bossPhase < BOSS_PHASE_COUNT`.
- A boss pattern cannot start when `bossPhase` is exactly `BOSS_PHASE_COUNT`.

`GameplayScene` remains responsible for resolving the runtime boss object and for all Phaser side effects: projectile cleanup, event removal, sprite reset, animation, tweens, and status messages.

## Files Expected To Change

- `src/domain/boss/bossRules.ts`
- `src/domain/boss/bossRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/boss/bossRules.ts` owns pure boss phase and pattern eligibility decisions.

`GameplayScene.ts` remains the Phaser adapter that converts runtime objects into domain inputs and applies side effects.

## TDD Plan

1. Add focused tests for `canStartBossPattern()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function in the boss domain.
4. Wire `GameplayScene.startBossPattern()` to call the pure rule.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- Domain function defaults to `BOSS_PHASE_COUNT`.
- `GameplayScene.startBossPattern()` no longer embeds the full guard expression.
- Boss pattern side effects remain unchanged.
- Verification passes and the slice is committed.
