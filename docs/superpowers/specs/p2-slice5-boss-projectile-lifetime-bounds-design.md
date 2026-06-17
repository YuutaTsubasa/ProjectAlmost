# Boss Projectile Lifetime And Bounds Design Spec

## Purpose

Extract boss projectile lifetime and world-bounds decisions from `GameplayScene.ts` into a pure boss domain module.

This is P2 Slice 5 of the `GameplayScene` domain extraction effort. The slice keeps Phaser projectile reads, destruction, fade tweens, hit checks, crouch checks, and player damage side effects inside `GameplayScene`, while moving the time and bounds decisions into `src/domain/boss/`.

## Problem

`GameplayScene.ts` currently decides whether a boss projectile should be removed with inline expressions:

- expired when `now - spawnedAt > 7200`
- outside when `x < -80 || x > worldWidth + 80 || y < -80 || y > worldHeight + 80`

These are pure gameplay rules. Keeping them embedded in the Phaser scene makes it harder to test strict boundary behavior and easier to change projectile lifetime accidentally.

## Design

Add `src/domain/boss/projectileRules.ts`:

```ts
export const BOSS_PROJECTILE_LIFETIME_MS = 7200
export const BOSS_PROJECTILE_BOUNDS_MARGIN = 80

export function isBossProjectileExpired(input: {
  now: number
  spawnedAt: number
  lifetimeMs?: number
}): boolean

export function isBossProjectileOutOfBounds(input: {
  x: number
  y: number
  worldWidth: number
  worldHeight: number
  margin?: number
}): boolean
```

Behavior:

- expiration uses strict `>` and keeps projectiles alive at exactly the lifetime.
- bounds uses strict `<` and `>` and keeps projectiles alive at exactly the margin boundary.
- optional `lifetimeMs` and `margin` support direct edge-case tests without changing defaults.

`GameplayScene.updateBossProjectiles()` calls these functions for the two boolean decisions only.

## Non-Goals

This slice does not:

- move Phaser projectile position reads into the domain.
- move destroy, fade, hit, crouch, or player damage behavior into the domain.
- change the existing outside-before-expired removal order.
- change projectile spawn, velocity, lifetime, blend mode, or hit radius.
- merge this margin with player out-of-bounds margin. They are separate domain concepts.

## Tests

Add tests to `src/domain/boss/projectileRules.test.ts`:

- default lifetime is `7200`.
- default margin is `80`.
- elapsed time greater than lifetime is expired.
- elapsed time equal to lifetime is not expired.
- elapsed time below lifetime is not expired.
- each side outside the margin is out of bounds.
- exact margin boundaries are not out of bounds.
- positions inside the expanded bounds are not out of bounds.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
