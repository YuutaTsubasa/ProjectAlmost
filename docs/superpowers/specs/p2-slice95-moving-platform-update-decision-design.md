# P2 Slice 95: Moving Platform Update Decision

## Target Behavior

Move the moving-platform update flow decision out of `GameplayScene.updateMovingPlatforms()` and into the pure world domain layer.

The existing behavior must be preserved:

- while the player is dead, moving platforms stop
- after the stage is cleared, moving platforms stop
- during active gameplay, moving platforms update normally

## Domain Shape

Add `getMovingPlatformUpdateDecision()` to `src/domain/world/movingPlatformRules.ts`:

```ts
export type MovingPlatformUpdateDecision = 'stop' | 'update'

export function getMovingPlatformUpdateDecision(input: {
  dead: boolean
  stageCleared: boolean
}): MovingPlatformUpdateDecision
```

The function is pure and must not import Phaser, Svelte, DOM, or scene code.

## Adapter Boundary

`GameplayScene.updateMovingPlatforms()` remains responsible for:

- setting Phaser body velocity to zero when the decision is `stop`
- calculating per-platform positions and velocities
- moving the player when they are carried by a platform
- updating Phaser bodies from game objects

The scene should delegate only the stop/update decision.

## Tests

Add focused world domain tests for:

- dead player returns `stop`
- cleared stage returns `stop`
- dead and cleared returns `stop`
- active gameplay returns `update`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused moving-platform domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
