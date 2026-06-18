# P2 Slice 90: Gravity Zone Update Eligibility Rule

## Target Behavior

Move the `updateGravityZones()` early-return guard into a pure world gravity-domain rule.

The current behavior is:

- Do not update gravity zones when the stage has no gravity zones.
- Do not update gravity zones while the player is dead.
- Do not update gravity zones after the stage is cleared.
- Otherwise, look for the active gravity zone and apply gravity direction changes.

All Phaser and scene side effects stay in `GameplayScene`: reading player position, finding the active zone, comparing gravity direction, applying player gravity, and updating the player body.

## Domain Shape

Add to `src/domain/world/gravityRules.ts`:

```ts
export function shouldUpdateGravityZones(input: {
  hasGravityZones: boolean
  dead: boolean
  stageCleared: boolean
}): boolean
```

The rule returns true only when gravity zones exist and gameplay is active.

## Adapter Shape

In `GameplayScene.updateGravityZones()`:

```ts
if (!shouldUpdateGravityZones({
  hasGravityZones: this.stage.gravityZones !== undefined,
  dead: this.isDead,
  stageCleared: this.stageCleared,
})) return
```

The existing `this.stage.gravityZones ?? []` adapter pattern can be used for the following `findActiveGravityZone()` call after the guard.

## Test Plan

Add tests in `src/domain/world/gravityRules.test.ts`:

- no gravity zones -> `false`
- player dead -> `false`
- stage cleared -> `false`
- zones exist and gameplay active -> `true`

## Validation

- RED: focused gravity test fails before production implementation.
- GREEN: focused gravity test passes after implementation.
- `npm run test`
- `npm run check`
- `git diff --check`
- `npm run build`
- `git diff --cached --check` before commit
