# P2 Slice 112: Moving Platform Delta Seconds Rule

## Target Behavior

Move the moving-platform frame delta seconds calculation out of `GameplayScene.updateMovingPlatforms()` and into the pure world domain.

The behavior must remain unchanged:

- Convert frame delta milliseconds to seconds.
- Clamp the result to a minimum of `0.001` seconds.

## Domain Boundary

Add a pure rule in `src/domain/world/movingPlatformRules.ts`.

The rule only converts and clamps timing data. It must not know about Phaser game loops, sprites, platform bodies, player carrying, velocity application, or scene state.

Suggested shape:

```ts
export const MOVING_PLATFORM_MIN_DELTA_SECONDS = 0.001

export function getMovingPlatformDeltaSeconds(input: {
  deltaMs: number
  minDeltaSeconds?: number
}): number {
  return Math.max(input.deltaMs / 1000, input.minDeltaSeconds ?? MOVING_PLATFORM_MIN_DELTA_SECONDS)
}
```

## Scene Adapter

`GameplayScene.updateMovingPlatforms()` keeps all side effects:

- calculating platform next position
- applying body velocity
- setting sprite position
- carrying the player
- updating previous platform position

The scene should only call the pure timing rule instead of inlining the conversion/clamp expression.

## Tests

Add co-located domain tests covering:

- `16` ms becomes `0.016` seconds.
- `1` ms clamps to `0.001` seconds.
- `0` ms clamps to `0.001` seconds.
- A custom minimum can be supplied.

## Validation

- Focused RED/GREEN test for `src/domain/world/movingPlatformRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change moving-platform position math.
- Do not change rider detection.
- Do not change velocity, sprite, or player body side effects.
