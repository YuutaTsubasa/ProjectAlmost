# P2 Slice 15: Homing Coin Line Collection Geometry

## Target Behavior

Move the Homing Attack coin-line collection geometry out of `GameplayScene` and into a pure player-domain rule.

Current behavior must be preserved:

- Coins are collected when their center is within `52` pixels of the Homing Attack line segment.
- The closest point is computed by projecting the coin center onto the line segment and clamping progress to `[0, 1]`.
- If the line segment has zero length, the closest point is the start point.
- The boundary is inclusive: distance exactly `52` is collectable.

## Domain API

Add to `src/domain/player/homingRules.ts`:

```ts
export const HOMING_LINE_COIN_COLLECTION_RADIUS = 52

export function isPointCollectableByHomingLine(input: {
  startX: number
  startY: number
  endX: number
  endY: number
  pointX: number
  pointY: number
  radius?: number
}): boolean
```

## Ownership Boundary

Domain owns:

- Segment projection.
- Clamped closest-point geometry.
- Homing line coin collection radius.

`GameplayScene` keeps:

- Iterating runtime coin sprites.
- Skipping already collected coins.
- Calling `collectCoin()`.
- General player-to-coin pickup behavior, which uses a separate strict `< 52` check and is out of scope.

## Validation Plan

- Add failing tests before implementation.
- Verify tests fail because the new constant/function do not exist.
- Implement the pure geometry rule.
- Replace only `collectCoinsAlongLine()` geometry with the domain function.
- Run `npm run test -- src/domain/player/homingRules.test.ts`, `npm run test`, `npm run check`, `git diff --check`, and `npm run build`.

## Out Of Scope

- Do not change Homing trail visuals.
- Do not change `collectCoin()` animation/SFX/HUD side effects.
- Do not change normal player collision coin pickup.
