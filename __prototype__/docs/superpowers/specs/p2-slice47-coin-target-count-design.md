# P2 Slice 47: Coin Target Count

## Target Behavior

Move the coin target count used by gameplay HUD, stage result, coin labels, and rank input out of `GameplayScene` and into the pure stage coin domain.

The Phaser scene still owns selected stage data, runtime coin sprites, pickup state, and HUD event dispatch. The domain receives structural coin entries and returns the total target count.

## Domain Rule

`getCoinTargetCount(input)` returns the number of coin entries.

The input is structural and does not require any concrete stage or Phaser type. The domain must not import Phaser, Svelte, DOM APIs, or game scene types.

## Files Expected To Change

- `src/domain/stage/coinRules.ts`
- `src/domain/stage/coinRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Risks

- Do not change coin pickup, coin scanning, homing trail collection, labels, or scoring weights.
- Do not change stage JSON or runtime coin sprite lifecycle.
- Keep `GameplayScene` as the adapter that passes selected stage coin data into the pure rule.

## Validation Plan

1. Add domain tests first and verify the missing module/function fails.
2. Implement the minimal pure function.
3. Wire `GameplayScene` `coinTargetCount` getter to call the domain rule.
4. Run the focused coin domain test, full test suite, `npm run check`, `npm run build`, and `git diff --check`.
