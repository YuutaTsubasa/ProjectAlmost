# P2 Slice 87: Player Control Flow Decision Rule

## Target Behavior

Move the player-control early-return decision in `GameplayScene.update()` into a pure player movement-domain rule.

The current behavior after grounded state and jump buffering is:

- If the player is dead, stop horizontal acceleration and skip the rest of player control.
- If the stage is cleared, stop horizontal acceleration and horizontal velocity, update idle animation, and skip the rest of player control.
- Otherwise continue processing crouch, movement, jump, attack, homing, timer, and out-of-bounds checks.

The rule should preserve the existing priority: `dead` is checked before `stageCleared`.

## Domain Shape

Add to `src/domain/player/movementRules.ts`:

```ts
export type PlayerControlFlowDecision = 'active' | 'dead' | 'stage-cleared'

export function getPlayerControlFlowDecision(input: {
  dead: boolean
  stageCleared: boolean
}): PlayerControlFlowDecision
```

The rule returns:

- `'dead'` when `dead` is true
- `'stage-cleared'` when `dead` is false and `stageCleared` is true
- `'active'` otherwise

## Adapter Shape

`GameplayScene.update()` should call the rule after grounded/jump-buffer updates:

```ts
const controlFlow = getPlayerControlFlowDecision({
  dead: this.isDead,
  stageCleared: this.stageCleared,
})
```

Scene side effects stay in `GameplayScene`:

- dead: `setAccelerationX(0)`
- stage-cleared: `setAccelerationX(0)`, `setVelocityX(0)`, `updatePlayerAnimation(false, grounded)`

## Test Plan

Add tests in `src/domain/player/movementRules.test.ts`:

- active when not dead and not cleared
- dead when dead
- stage-cleared when cleared but not dead
- dead takes priority when both dead and cleared

## Validation

- RED: focused movement test fails before production implementation.
- GREEN: focused movement test passes after implementation.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
