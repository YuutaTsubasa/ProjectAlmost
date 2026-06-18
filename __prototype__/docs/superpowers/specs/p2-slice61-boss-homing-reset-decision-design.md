# P2 Slice 61: Boss Homing Reset Decision Rule

## Target Behavior

Move the Homing Attack boss-run reset decision out of `GameplayScene.resolveHomingAttack()` and into the boss domain.

The behavior must remain unchanged:

- Homing a non-boss target never resets the boss run.
- Homing the boss target resets the boss run while the current phase is before the final playable phase.
- Homing the boss target does not reset the boss run on the final playable phase.

`GameplayScene` remains responsible for identifying whether the target sprite is the boss sprite, defeating the target, and finishing or continuing the Homing Attack.

## Files Expected To Change

- `src/domain/boss/bossRules.ts`
- `src/domain/boss/bossRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/boss/bossRules.ts` owns pure boss phase decisions.

`GameplayScene.ts` remains the Phaser adapter for sprite identity, enemy defeat, Homing Attack state, player velocity, sound, and animation side effects.

## TDD Plan

1. Add focused tests for `shouldResetBossRunAfterHomingHit()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function in the boss domain.
4. Wire `GameplayScene.resolveHomingAttack()` to call the pure rule after converting sprite identity to a boolean.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- Domain function defaults to `BOSS_PHASE_COUNT`.
- `GameplayScene.resolveHomingAttack()` no longer embeds `bossPhase < BOSS_PHASE_COUNT - 1`.
- Homing Attack side effects and boss target identity checks remain in `GameplayScene`.
- Verification passes and the slice is committed.
