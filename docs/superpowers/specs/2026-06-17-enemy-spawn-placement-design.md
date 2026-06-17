# Enemy Spawn Placement Design Spec

## Purpose

Extract enemy spawn-Y placement rules from `GameplayScene.ts` into the pure placement domain.

This is P2 Slice 3 of the `GameplayScene` domain extraction effort. The slice keeps Phaser sprite creation, body setup, tweens, animation, and regeneration side effects inside `GameplayScene`, while moving the repeated spawn-Y decision into `src/domain/placement/`.

## Problem

`GameplayScene.ts` computed enemy spawn Y in two places:

- initial enemy creation
- enemy regeneration

Both used the same rule:

```ts
point.type === 'azure-core' ? point.y : groundedCenterY(point.surfaceY, 'guard')
```

This rule is placement logic:

- Azure Cores are airborne and use author-provided `y`.
- Guards are grounded and derive center Y from `surfaceY` using the guard object definition.
- Missing enemy type behaves like a guard.

Keeping the rule duplicated in the scene makes future enemy placement changes more error-prone.

## Design

Add `getEnemySpawnY()` to `src/domain/placement/objectDefinitions.ts`.

The function accepts only the minimal enemy shape it needs:

```ts
export function getEnemySpawnY(
  enemy:
    | { type: 'azure-core'; y: number }
    | { type?: 'guard'; surfaceY: number },
): number
```

Behavior:

- `type: 'azure-core'` returns `enemy.y`.
- `type: 'guard'` returns `groundedCenterY(enemy.surfaceY, 'guard')`.
- missing `type` behaves like guard and returns `groundedCenterY(enemy.surfaceY, 'guard')`.

`GameplayScene` calls `getEnemySpawnY(point)` in both initial creation and regeneration.

## Non-Goals

This slice does not:

- create `getEnemySpawnPosition()`.
- wrap `x`, because `x` is already a direct passthrough.
- create a generic `getSpawnAnchorY(definitionId)`.
- change object definitions.
- change enemy stage JSON.
- change sprite, tween, body, or animation behavior.

## Tests

Add tests to `src/domain/placement/objectDefinitions.test.ts`:

- Azure Core returns authored `y`.
- explicit guard returns `groundedCenterY(surfaceY, 'guard')`.
- missing type returns the same grounded guard Y.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
