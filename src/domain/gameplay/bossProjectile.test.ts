import { describe, expect, it } from 'vitest'
import {
  BOSS_PROJECTILE_BOUNDS_MARGIN,
  BOSS_PROJECTILE_HIT_DISTANCE,
  BOSS_PROJECTILE_LIFETIME_MS,
  getBossProjectileHitDecision,
  getBossProjectileLifecycleDecision,
  getBossProjectileVelocity,
  isBossProjectileExpired,
  isBossProjectileOutOfBounds,
  shouldUpdateBossProjectiles,
} from './bossProjectile'

describe('boss projectile rules', () => {
  it('uses Prototype projectile constants', () => {
    expect(BOSS_PROJECTILE_LIFETIME_MS).toBe(7200)
    expect(BOSS_PROJECTILE_BOUNDS_MARGIN).toBe(80)
    expect(BOSS_PROJECTILE_HIT_DISTANCE).toBe(42)
  })

  it('expires only after elapsed time exceeds the lifetime', () => {
    expect(isBossProjectileExpired({ now: 7201, spawnedAt: 0 })).toBe(true)
    expect(isBossProjectileExpired({ now: 7200, spawnedAt: 0 })).toBe(false)
    expect(isBossProjectileExpired({ now: 7199, spawnedAt: 0 })).toBe(false)
  })

  it('detects expanded world bounds', () => {
    const world = { worldWidth: 1920, worldHeight: 1080 }

    expect(isBossProjectileOutOfBounds({ ...world, x: -81, y: 540 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: -80, y: 540 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 2001, y: 540 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 2000, y: 540 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: -81 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: -80 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: 1161 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: 1160 })).toBe(false)
  })

  it('decides projectile hits against player state and crouch pass-through', () => {
    expect(getBossProjectileHitDecision({
      playerDead: true,
      playerCrouching: false,
      distanceToPlayer: 0,
    })).toBe('ignore')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 42,
    })).toBe('ignore')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: true,
      distanceToPlayer: 41,
    })).toBe('pass-through-crouch')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 41,
    })).toBe('hit')
  })

  it('decides lifecycle with outside taking priority over expired', () => {
    expect(getBossProjectileLifecycleDecision({ outside: true, expired: false })).toBe('destroy')
    expect(getBossProjectileLifecycleDecision({ outside: true, expired: true })).toBe('destroy')
    expect(getBossProjectileLifecycleDecision({ outside: false, expired: true })).toBe('fade')
    expect(getBossProjectileLifecycleDecision({ outside: false, expired: false })).toBe('keep')
  })

  it('calculates velocity from angle and speed', () => {
    expect(getBossProjectileVelocity({ angle: 0, speed: 390 })).toEqual({ x: 390, y: 0 })
    expect(getBossProjectileVelocity({ angle: Math.PI, speed: 390 }).x).toBeCloseTo(-390)
    expect(getBossProjectileVelocity({ angle: Math.PI / 2, speed: 390 }).y).toBeCloseTo(390)
  })

  it('updates only when there are active projectiles', () => {
    expect(shouldUpdateBossProjectiles({ projectileCount: 0 })).toBe(false)
    expect(shouldUpdateBossProjectiles({ projectileCount: 1 })).toBe(true)
  })
})
