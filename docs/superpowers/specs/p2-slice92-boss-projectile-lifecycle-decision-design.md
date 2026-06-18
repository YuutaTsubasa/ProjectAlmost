# P2 Slice 92: Boss Projectile Lifecycle Decision

## Target Behavior

Move the boss projectile lifecycle priority rule from `GameplayScene.updateBossProjectiles()` into the pure boss projectile domain layer.

For each projectile:

- if it is outside the world bounds, destroy it immediately
- otherwise, if it is expired, fade it out
- otherwise, keep it alive and continue hit checks

The existing priority matters: outside wins over expired when both are true.

## Domain Shape

Add `getBossProjectileLifecycleDecision()` to `src/domain/boss/projectileRules.ts`:

```ts
export type BossProjectileLifecycleDecision = 'destroy' | 'fade' | 'keep'

export function getBossProjectileLifecycleDecision(input: {
  outside: boolean
  expired: boolean
}): BossProjectileLifecycleDecision
```

The function is pure and must not import Phaser, Svelte, DOM, or game scene code.

## Adapter Boundary

`GameplayScene.updateBossProjectiles()` remains responsible for:

- reading Phaser sprite position and `spawnedAt`
- calling existing bounds and lifetime domain checks
- calling `destroyBossProjectile()` or `fadeBossProjectile()`
- running hit checks for kept projectiles

The scene should delegate only the lifecycle priority decision.

## Tests

Add focused boss projectile domain tests for:

- outside returns `destroy`
- expired but not outside returns `fade`
- outside and expired returns `destroy`
- neither outside nor expired returns `keep`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused boss projectile domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
