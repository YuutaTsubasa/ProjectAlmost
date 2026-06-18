# P2 Slice 63: Boss Respawn Pattern Restart Rule

## Target Behavior

Move the boss-pattern restart decision after player respawn out of `GameplayScene.respawnPlayer()` and into the boss domain.

The behavior must remain unchanged:

- Non-boss stages do not restart a boss pattern after respawn.
- Boss stages restart the boss pattern while `bossPhase < BOSS_PHASE_COUNT`.
- Boss stages do not restart the boss pattern when `bossPhase` is exactly `BOSS_PHASE_COUNT`.

`GameplayScene` remains responsible for Phaser timing and calling `startBossPattern()`.

## Files Expected To Change

- `src/domain/boss/bossRules.ts`
- `src/domain/boss/bossRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/boss/bossRules.ts` owns pure boss phase decisions.

`GameplayScene.ts` remains the Phaser adapter for delayed calls, scene state mutation, player respawn side effects, and pattern startup.

## TDD Plan

1. Add focused tests for `shouldRestartBossPatternAfterRespawn()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function in the boss domain.
4. Wire `GameplayScene.respawnPlayer()` to call the pure rule.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- Domain function defaults to `BOSS_PHASE_COUNT`.
- `GameplayScene.respawnPlayer()` no longer embeds `isBossStage && bossPhase < BOSS_PHASE_COUNT`.
- Respawn side effects and the `500ms` delayed call remain unchanged.
- Verification passes and the slice is committed.
