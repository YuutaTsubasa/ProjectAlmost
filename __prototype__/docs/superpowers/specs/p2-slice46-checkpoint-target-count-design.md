# P2 Slice 46: Checkpoint Target Count

## Target Behavior

Move the checkpoint target count used by gameplay HUD and stage result out of `GameplayScene` and into the pure checkpoint domain.

The Phaser scene still owns selected stage data, checkpoint progression state, and event dispatch. The domain receives structural checkpoint entries and returns the total target count.

## Domain Rule

`getCheckpointTargetCount(input)` returns the number of checkpoint entries.

The input is structural and does not require any concrete stage or Phaser type. The domain must not import Phaser, Svelte, DOM APIs, or game scene types.

## Files Expected To Change

- `src/domain/stage/checkpointRules.ts`
- `src/domain/stage/checkpointRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change active checkpoint index, reached checkpoint count, or checkpoint trigger logic.
- Do not change scoring weights or rank calculation.
- Keep `GameplayScene` as the adapter that passes selected stage checkpoint data into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing function fails.
2. Implement the minimal pure function.
3. Wire both gameplay HUD and stage result checkpoint target values to call the domain rule.
4. Run the focused checkpoint domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
