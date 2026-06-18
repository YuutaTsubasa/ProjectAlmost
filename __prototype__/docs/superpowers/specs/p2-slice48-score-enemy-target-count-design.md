# P2 Slice 48: Score Enemy Target Count

## Target Behavior

Move the score enemy target count used by gameplay HUD, stage result, and rank input out of `GameplayScene` and into the pure enemy domain.

The Phaser scene still owns selected stage data, runtime enemy objects, kill events, and HUD event dispatch. The domain receives structural stage enemy entries and returns the number of enemies that count for score.

## Domain Rule

`getScoreEnemyTargetCount(input)` returns the number of enemy entries where `enemyCountsForScore(enemy)` is true.

The input is structural and follows the existing `EnemyRuleInput` shape. The domain must not import Phaser, Svelte, DOM APIs, or game scene types.

## Files Expected To Change

- `src/domain/enemy/enemyRules.ts`
- `src/domain/enemy/enemyRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change `enemyCountsForScore` semantics.
- Do not change runtime kill counting, respawn, regeneration, or boss behavior.
- Keep `GameplayScene` as the adapter that passes selected stage enemy data into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function, reusing `enemyCountsForScore`.
3. Wire `GameplayScene` `scoreEnemyTargetCount` getter to call the domain rule.
4. Run the focused enemy domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
