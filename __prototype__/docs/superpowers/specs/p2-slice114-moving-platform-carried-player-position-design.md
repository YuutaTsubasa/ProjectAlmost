# P2 Slice 114: Moving Platform Carried Player Position Rule

## Target Behavior

Move the carried-player position calculation out of `GameplayScene.updateMovingPlatforms()` and into the pure world domain.

The behavior must remain unchanged:

- Carried player X becomes `playerX + deltaX`.
- Carried player Y becomes `playerY + deltaY`.
- Zero movement leaves that axis unchanged.
- Negative deltas move the player backward/upward on that axis.

## Domain Boundary

Add a pure rule in `src/domain/world/movingPlatformRules.ts`.

The rule only calculates the next player position from the current position and moving-platform deltas. It must not know about Phaser bodies, sprites, rider detection, gravity, or scene state.

Suggested shape:

```ts
export function getMovingPlatformCarriedPlayerPosition(input: {
  playerX: number
  playerY: number
  deltaX: number
  deltaY: number
}): { x: number; y: number } {
  return {
    x: input.playerX + input.deltaX,
    y: input.playerY + input.deltaY,
  }
}
```

## Scene Adapter

`GameplayScene.updateMovingPlatforms()` keeps all side effects:

- deciding whether the player is riding the platform
- mutating player position
- updating the player body from the game object
- updating platform previous position

The scene should only call the pure carried-player position rule inside the existing `if (carryingPlayer)` branch.

## Tests

Add co-located domain tests covering:

- Positive deltas move both axes forward.
- Zero delta leaves that axis unchanged.
- Negative deltas move both axes backward.
- X and Y deltas are applied independently.

## Validation

- Focused RED/GREEN test for `src/domain/world/movingPlatformRules.test.ts`.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`

## Out Of Scope

- Do not change rider detection.
- Do not change moving-platform position or velocity math.
- Do not change Phaser body updates.
- Do not change player physics or gravity behavior.
