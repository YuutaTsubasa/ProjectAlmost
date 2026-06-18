# P2 Slice 64: Stage Action Start Decision Rule

## Target Behavior

Move the pure "first gameplay action starts the stage" decision out of `GameplayScene.update()` and into the stage timer domain.

The behavior must remain unchanged:

- If the stage timer has already started, the first-action decision is false.
- If the stage timer has not started, any movement, crouch, jump, or attack input starts stage action.
- If no gameplay input is active, stage action does not start.

`GameplayScene` remains responsible for reading keyboard/gamepad/touch inputs and calling `startStageAction()`.

## Files Expected To Change

- `src/domain/stage/timerRules.ts`
- `src/domain/stage/timerRules.test.ts`
- `src/game/scenes/GameplayScene.ts`

## Architecture Boundary

`src/domain/stage/timerRules.ts` owns pure stage timer and start decisions.

`GameplayScene.ts` remains the Phaser/input adapter that converts concrete inputs to booleans and applies side effects.

## TDD Plan

1. Add focused tests for `shouldStartStageAction()`.
2. Run the focused test and verify RED because the function is missing.
3. Implement the pure function in the timer domain.
4. Wire `GameplayScene.update()` to call the pure rule.
5. Run focused tests, full tests, check, build, and whitespace checks.

## DoD

- Domain function imports no Phaser, Svelte, DOM, or game adapter modules.
- Domain function covers already-started, no-input, and each start input.
- `GameplayScene.update()` no longer embeds the full first-action boolean expression.
- Input reading and `startStageAction()` side effects remain unchanged.
- Verification passes and the slice is committed.
