# P2 Slice 49: Boss Stage Definition

## Target Behavior

Move the boss-stage detection rule out of `GameplayScene` and into the pure boss domain.

The Phaser scene still owns selected stage data, boss runtime objects, projectile patterns, and HUD event dispatch. The domain receives structural stage id plus enemy ids and decides whether the stage should be treated as a boss stage.

## Domain Rule

`isBossStageDefinition(input)` returns true only when:

- `stageId` ends with `-6`.
- At least one enemy entry has `id === 'boss-prototype'`.

The input is structural and does not require any concrete stage or Phaser type. The domain must not import Phaser, Svelte, DOM APIs, or game scene types.

## Files Expected To Change

- `src/domain/boss/bossRules.ts`
- `src/domain/boss/bossRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change boss runtime lookup, boss phase behavior, projectile patterns, or boss defeat rules.
- Do not infer boss stages from stage id alone.
- Keep `GameplayScene` as the adapter that passes selected stage id and enemy metadata into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Wire `GameplayScene` `isBossStage` getter to call the domain rule.
4. Run the focused boss domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
