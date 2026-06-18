# P2 Slice 17: Homing Trail Sample Geometry

## Target Behavior

Move Homing Attack trail sample calculation out of `GameplayScene` and into a pure player-domain rule.

Current behavior must be preserved:

- Trail count is `Math.max(2, Math.ceil(distance / 28))`.
- Distance is Euclidean distance from start to end.
- Each sample uses `progress = index / trailCount`, so the last sample intentionally does not reach progress `1`.
- Sample position is linear interpolation from start to end.
- Sample alpha is `0.42 * (1 - progress * 0.35)`.

## Domain API

Add to `src/domain/player/homingRules.ts`:

```ts
export const HOMING_TRAIL_SPACING = 28

export type HomingTrailSample = {
  x: number
  y: number
  progress: number
  alpha: number
}

export function getHomingTrailSamples(input: {
  startX: number
  startY: number
  endX: number
  endY: number
  spacing?: number
}): HomingTrailSample[]
```

## Ownership Boundary

Domain owns:

- Trail count.
- Linear interpolation.
- Progress and alpha calculation.

`GameplayScene` keeps:

- Creating Phaser sprites.
- Sprite depth, scale, flip, tint, blend mode.
- Tween fade duration/delay and sprite destruction.
- Homing attack frame and visual asset choice.

## Validation Plan

- Add failing tests before implementation.
- Verify tests fail because the new constant/function do not exist.
- Implement the pure sample rule.
- Replace only the math inside `emitHomingTrail()`.
- Run `npm run test -- src/domain/player/homingRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change Homing Attack path, trail sprite frame, tint, fade timing, blend mode, or depth.
- Do not attempt to move Phaser rendering out of `GameplayScene` in this slice.
