# P2 Slice 115: Moving Platform Delta Vector Rule

## Target Behavior

Move moving-platform delta vector calculation out of `GameplayScene.updateMovingPlatforms()` and into the pure world domain.

The behavior must remain unchanged:

- Delta X is `nextX - previousX`.
- Delta Y is `nextY - previousY`.
- Matching previous and next positions produce zero delta on that axis.
- Negative movement produces negative delta on that axis.

## Domain Boundary

Add a pure rule in `src/domain/world/movingPlatformRules.ts`.

The rule only calculates a movement delta from previous and next positions. It must not know about Phaser bodies, sprites, player carrying, platform velocity, or scene state.

Suggested shape:

```ts
export function getMovingPlatformDelta(input: {
  previousX: number
  previousY: number
  nextX: number
  nextY: number
}): { x: number; y: number } {
  return {
    x: input.nextX - input.previousX,
    y: input.nextY - input.previousY,
  }
}
```

## Scene Adapter

`GameplayScene.updateMovingPlatforms()` keeps all side effects:

- reading previous platform position from runtime state
- setting platform velocity and position
- carrying the player
- updating previous platform position after side effects

The scene should only call the pure delta rule and pass the returned `x` and `y` to existing velocity/carry rules.

## Tests

Add co-located domain tests covering:

- Positive movement on both axes.
- Zero movement on an axis.
- Negative movement on both axes.
- Independent X/Y movement.

## Validation

- Focused RED/GREEN test for `src/domain/world/movingPlatformRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change moving-platform position math.
- Do not change velocity math.
- Do not change carried-player position math.
- Do not change Phaser side effects.
