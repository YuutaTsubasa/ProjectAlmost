# Boss Projectile Hit Decision Design Spec

## Purpose

Extract the boss projectile player-hit decision from `GameplayScene.ts` into the pure boss projectile domain rules.

This is P2 Slice 7 of the `GameplayScene` domain extraction effort. The slice keeps Phaser distance measurement, projectile destruction, player damage, and loop control inside `GameplayScene`, while moving the hit/crouch/ignore decision into `src/domain/boss/projectileRules.ts`.

## Problem

`GameplayScene.updateBossProjectiles()` currently embeds the boss projectile hit rule:

- dead players are ignored.
- projectiles hit only when the distance to the player is strictly less than `42`.
- crouching players inside that distance block the hit.
- non-crouching players inside that distance are hit.

This rule is pure and can be tested without Phaser.

## Design

Add to `src/domain/boss/projectileRules.ts`:

```ts
export const BOSS_PROJECTILE_HIT_DISTANCE = 42

export type BossProjectileHitDecision = 'ignore' | 'blocked-by-crouch' | 'hit'

export function getBossProjectileHitDecision(input: {
  playerDead: boolean
  playerCrouching: boolean
  distanceToPlayer: number
  hitDistance?: number
}): BossProjectileHitDecision
```

Decision order:

1. dead player -> `ignore`
2. distance greater than or equal to hit distance -> `ignore`
3. crouching player -> `blocked-by-crouch`
4. otherwise -> `hit`

`GameplayScene.updateBossProjectiles()` still computes distance with Phaser and only destroys/applies damage when the decision is `hit`.

## Non-Goals

This slice does not:

- move Phaser distance calculation into the domain.
- move projectile destruction or player damage into the domain.
- change outside-before-expired ordering.
- change projectile lifetime, bounds, spawn, velocity, or blend mode.
- change the hit distance value.

## Tests

Add tests to `src/domain/boss/projectileRules.test.ts`:

- default hit distance is `42`.
- dead player returns `ignore`, even inside range.
- distance greater than hit distance returns `ignore`.
- distance equal to hit distance returns `ignore`.
- distance below hit distance while crouching returns `blocked-by-crouch`.
- distance below hit distance while not crouching returns `hit`.
- explicit hit distance can override the default for boundary checks.

## Verification

Required checks:

```bash
npm run test
npm run check
npm run build
git diff --check
```
