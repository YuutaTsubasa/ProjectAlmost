# P2 Slice 31: Stage Timer Advance

## Target Behavior

Extract the pure guard from `GameplayScene.updateTimer()`.

Current behavior must be preserved:

- timer does not advance before the stage timer has started
- timer does not advance after stage clear
- timer does not advance while the player is dead
- otherwise timer may advance by the frame delta and dispatch HUD state

## Files Expected To Change

- `src/domain/stage/timerRules.ts`
- `src/domain/stage/timerRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

Domain owns only the pure boolean decision.

Phaser scene keeps:

- reading `this.game.loop.delta`
- mutating `stageTimeMs`
- dispatching HUD state

## TDD Plan

1. Add a failing domain test for `shouldAdvanceStageTimer`.
2. Implement the minimal pure function.
3. Replace only the guard in `GameplayScene.updateTimer`.
4. Verify the full test/check/build gates.

## Acceptance Criteria

- Domain function imports no Phaser, Svelte, DOM, or browser APIs.
- Preserve exact guard semantics: `timerStarted && !stageCleared && !dead`.
- No timer formatting, rank, HUD dispatch, or stage clear behavior changes in this slice.
