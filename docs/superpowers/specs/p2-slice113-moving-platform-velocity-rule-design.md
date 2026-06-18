# P2 Slice 113: Moving Platform Velocity Rule

## Target Behavior

Move moving-platform velocity vector calculation out of `GameplayScene.updateMovingPlatforms()` and into the pure world domain.

The behavior must remain unchanged:

- Velocity X is `deltaX / deltaSeconds`.
- Velocity Y is `deltaY / deltaSeconds`.
- Zero movement produces zero velocity on that axis.
- Negative movement produces negative velocity on that axis.

## Domain Boundary

Add a pure rule in `src/domain/world/movingPlatformRules.ts`.

The rule only calculates a velocity vector from movement deltas and frame delta seconds. It must not know about Phaser bodies, sprites, player carrying, platform positions, or scene state.

Suggested shape:

```ts
export function getMovingPlatformVelocity(input: {
  deltaX: number
  deltaY: number
  deltaSeconds: number
}): { x: number; y: number } {
  return {
    x: input.deltaX / input.deltaSeconds,
    y: input.deltaY / input.deltaSeconds,
  }
}
```

## Scene Adapter

`GameplayScene.updateMovingPlatforms()` keeps all side effects:

- setting platform body velocity
- setting sprite position
- updating body from game object
- carrying the player
- updating previous platform position

The scene should only call the pure velocity rule and pass the returned `x` and `y` to `setVelocity()`.

## Tests

Add co-located domain tests covering:

- Positive deltas produce positive velocities.
- Zero delta on an axis produces zero velocity on that axis.
- Negative delta produces negative velocity.
- Non-uniform X/Y deltas are calculated independently.

## Validation

- Focused RED/GREEN test for `src/domain/world/movingPlatformRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change moving-platform position math.
- Do not change delta-seconds clamping.
- Do not change rider detection or player carrying.
- Do not change Phaser side effects.
