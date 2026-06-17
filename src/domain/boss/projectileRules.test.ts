import { describe, expect, test } from 'vitest'
import {
  BOSS_PROJECTILE_BOUNDS_MARGIN,
  BOSS_PROJECTILE_HIT_DISTANCE,
  BOSS_PROJECTILE_LIFETIME_MS,
  getBossProjectileHitDecision,
  isBossProjectileExpired,
  isBossProjectileOutOfBounds,
} from './projectileRules'

describe('isBossProjectileExpired', () => {
  test('uses the gameplay lifetime as the default', () => {
    expect(BOSS_PROJECTILE_LIFETIME_MS).toBe(7200)
  })

  test('expires only after elapsed time is greater than lifetime', () => {
    expect(isBossProjectileExpired({ now: 7201, spawnedAt: 0 })).toBe(true)
    expect(isBossProjectileExpired({ now: 7200, spawnedAt: 0 })).toBe(false)
    expect(isBossProjectileExpired({ now: 7199, spawnedAt: 0 })).toBe(false)
  })

  test('supports an explicit lifetime for boundary checks', () => {
    expect(isBossProjectileExpired({ now: 151, spawnedAt: 50, lifetimeMs: 100 })).toBe(true)
    expect(isBossProjectileExpired({ now: 150, spawnedAt: 50, lifetimeMs: 100 })).toBe(false)
  })
})

describe('isBossProjectileOutOfBounds', () => {
  test('uses the gameplay margin as the default', () => {
    expect(BOSS_PROJECTILE_BOUNDS_MARGIN).toBe(80)
  })

  test('is outside when past any expanded world edge', () => {
    const world = { worldWidth: 1920, worldHeight: 1080 }

    expect(isBossProjectileOutOfBounds({ ...world, x: -81, y: 540 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 2001, y: 540 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: -81 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: 1161 })).toBe(true)
  })

  test('keeps projectiles alive on exact expanded world boundaries', () => {
    const world = { worldWidth: 1920, worldHeight: 1080 }

    expect(isBossProjectileOutOfBounds({ ...world, x: -80, y: 540 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 2000, y: 540 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: -80 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 960, y: 1160 })).toBe(false)
  })

  test('keeps projectiles alive inside the expanded world bounds', () => {
    expect(isBossProjectileOutOfBounds({
      x: 960,
      y: 540,
      worldWidth: 1920,
      worldHeight: 1080,
    })).toBe(false)
  })

  test('supports an explicit margin for boundary checks', () => {
    const world = { worldWidth: 100, worldHeight: 80, margin: 10 }

    expect(isBossProjectileOutOfBounds({ ...world, x: -11, y: 40 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: -10, y: 40 })).toBe(false)
    expect(isBossProjectileOutOfBounds({ ...world, x: 111, y: 40 })).toBe(true)
    expect(isBossProjectileOutOfBounds({ ...world, x: 110, y: 40 })).toBe(false)
  })
})

describe('getBossProjectileHitDecision', () => {
  test('uses the gameplay hit distance as the default', () => {
    expect(BOSS_PROJECTILE_HIT_DISTANCE).toBe(42)
  })

  test('ignores dead players even inside hit distance', () => {
    expect(getBossProjectileHitDecision({
      playerDead: true,
      playerCrouching: false,
      distanceToPlayer: 0,
    })).toBe('ignore')
  })

  test('ignores projectiles outside hit distance or on the exact boundary', () => {
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 43,
    })).toBe('ignore')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 42,
    })).toBe('ignore')
  })

  test('blocks hits when player is crouching inside hit distance', () => {
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: true,
      distanceToPlayer: 41,
    })).toBe('blocked-by-crouch')
  })

  test('hits when player is alive, not crouching, and inside hit distance', () => {
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 41,
    })).toBe('hit')
  })

  test('supports an explicit hit distance for boundary checks', () => {
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 9,
      hitDistance: 10,
    })).toBe('hit')
    expect(getBossProjectileHitDecision({
      playerDead: false,
      playerCrouching: false,
      distanceToPlayer: 10,
      hitDistance: 10,
    })).toBe('ignore')
  })
})
