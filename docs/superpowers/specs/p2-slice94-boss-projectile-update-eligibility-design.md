# P2 Slice 94: Boss Projectile Update Eligibility

## Target Behavior

Move the boss projectile update entry gate from `GameplayScene.updateBossProjectiles()` into the pure boss projectile domain layer.

The update loop should run only when there is at least one boss projectile to inspect. Empty projectile lists should return immediately.

## Domain Shape

Add `shouldUpdateBossProjectiles()` to `src/domain/boss/projectileRules.ts`:

```ts
export function shouldUpdateBossProjectiles(input: {
  projectileCount: number
}): boolean
```

The function is pure and must not import Phaser, Svelte, DOM, or game scene code.

## Adapter Boundary

`GameplayScene.updateBossProjectiles()` remains responsible for:

- reading the runtime projectile array
- iterating over Phaser sprites
- running lifetime, bounds, lifecycle, and hit checks
- calling `destroyBossProjectile()` and `fadeBossProjectile()`

The scene should only delegate whether the update loop should run.

## Tests

Add focused boss projectile domain tests for:

- `projectileCount` 0 returns `false`
- positive `projectileCount` returns `true`
- negative `projectileCount` returns `false`

## Validation

- Watch the new focused test fail before implementation.
- Run the focused boss projectile domain test after implementation.
- Run `npm run test`.
- Run `npm run check`.
- Run `git diff --check`.
- Run `npm run build`.
