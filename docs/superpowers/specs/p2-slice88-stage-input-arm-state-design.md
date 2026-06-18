# P2 Slice 88: Stage Input Arm State Rule

## Target Behavior

Move the stage-input arming state transition from `GameplayScene.update()` into a pure stage timer/input-domain rule.

The current behavior before gameplay is armed is:

- If any gameplay input is still held, keep `stageInputArmed` false.
- Once no gameplay input is held, set `stageInputArmed` true.
- While not armed, `GameplayScene` still stops acceleration, updates parallax, and returns early.

This preserves the startup behavior where held keys/buttons from the previous screen do not immediately start the stage.

## Domain Shape

Add to `src/domain/stage/timerRules.ts`:

```ts
export function getStageInputArmedState(input: {
  stageInputArmed: boolean
  gameplayInputHeld: boolean
}): boolean
```

The rule returns:

- `true` when already armed
- `false` when unarmed and gameplay input is held
- `true` when unarmed and no gameplay input is held

## Adapter Shape

`GameplayScene.update()` should compute the next armed state inside the existing unarmed branch:

```ts
if (!this.stageInputArmed) {
  this.stageInputArmed = getStageInputArmedState({
    stageInputArmed: this.stageInputArmed,
    gameplayInputHeld,
  })
  this.player.setAccelerationX(0)
  this.updateParallaxBackground()
  return
}
```

Scene side effects remain in `GameplayScene`.

## Test Plan

Add tests in `src/domain/stage/timerRules.test.ts`:

- already armed stays armed even when input is held
- unarmed stays unarmed while gameplay input is held
- unarmed becomes armed after all gameplay input is released

## Validation

- RED: focused timer test fails before production implementation.
- GREEN: focused timer test passes after implementation.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
