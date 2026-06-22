import { describe, expect, it } from 'vitest'
import {
  PLAYER_HIT_DAMAGE,
  PLAYER_MAX_HEALTH,
  PLAYER_OUT_OF_BOUNDS_MARGIN,
  canApplyPlayerDamage,
  canApplyPlayerEnemyHit,
  canEnterPlayerDefeat,
  getPlayerDamageOutcome,
  getPlayerDefeatEntryState,
  getPlayerDefeatOutcome,
  getPlayerHurtEntryState,
  getPlayerHurtRecoveryState,
  getPlayerHurtVelocity,
  getPlayerInvulnerabilityRecoveryState,
  getPlayerKnockbackDirection,
  getPlayerRespawnState,
  isPlayerOutsideWorldBounds,
} from './playerLife'

describe('player life constants', () => {
  it('keeps prototype health, damage, and world margin explicit', () => {
    expect(PLAYER_MAX_HEALTH).toBe(3)
    expect(PLAYER_HIT_DAMAGE).toBe(1)
    expect(PLAYER_OUT_OF_BOUNDS_MARGIN).toBe(128)
  })
})

describe('canApplyPlayerEnemyHit', () => {
  it('allows active enemy contact when no blocking state is active', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks enemy contact damage while protected or enemy is defeated', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: true,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: true,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: true,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: true,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: true,
    })).toBe(false)
  })
})

describe('canApplyPlayerDamage', () => {
  it('allows generic damage when no blocking state is active', () => {
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks generic damage for protected states', () => {
    expect(canApplyPlayerDamage({
      invulnerable: true,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: true,
      homingAttacking: false,
      crouching: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: true,
      crouching: false,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: true,
      dead: false,
    })).toBe(false)
    expect(canApplyPlayerDamage({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      crouching: false,
      dead: true,
    })).toBe(false)
  })
})

describe('player damage outcome', () => {
  it('survives normal damage while health remains above zero', () => {
    expect(getPlayerDamageOutcome({ currentHealth: 3 })).toEqual({
      type: 'survived',
      nextHealth: 2,
    })
  })

  it('defeats when damage reaches zero health', () => {
    expect(getPlayerDamageOutcome({ currentHealth: 1 })).toEqual({
      type: 'defeated',
      nextHealth: 0,
    })
  })

  it('supports explicit damage for bounds-style checks', () => {
    expect(getPlayerDamageOutcome({ currentHealth: 3, damage: 3 })).toEqual({
      type: 'defeated',
      nextHealth: 0,
    })
  })
})

describe('hurt and recovery states', () => {
  it('enters hurt state by canceling attack and enabling invulnerability', () => {
    expect(getPlayerHurtEntryState()).toEqual({
      hurting: true,
      invulnerable: true,
      attacking: false,
      attackReady: false,
    })
  })

  it('recovers hurting before invulnerability', () => {
    expect(getPlayerHurtRecoveryState()).toEqual({
      hurting: false,
      attackReady: true,
    })
    expect(getPlayerInvulnerabilityRecoveryState()).toEqual({
      invulnerable: false,
    })
  })
})

describe('defeat and respawn states', () => {
  it('enters defeat once and clears player action states', () => {
    expect(canEnterPlayerDefeat({ dead: false })).toBe(true)
    expect(canEnterPlayerDefeat({ dead: true })).toBe(false)
    expect(getPlayerDefeatEntryState()).toEqual({
      dead: true,
      hurting: false,
      invulnerable: true,
      attacking: false,
      attackReady: false,
    })
  })

  it('respawns with full health and action readiness', () => {
    expect(getPlayerRespawnState()).toEqual({
      health: 3,
      hurting: false,
      invulnerable: false,
      dead: false,
      attacking: false,
      attackReady: true,
    })
    expect(getPlayerRespawnState({ maxHealth: 5 }).health).toBe(5)
  })
})

describe('player velocities', () => {
  it('knocks away from damage source', () => {
    expect(getPlayerKnockbackDirection({ playerX: 100, sourceX: 120 })).toBe(-1)
    expect(getPlayerKnockbackDirection({ playerX: 120, sourceX: 120 })).toBe(1)
    expect(getPlayerKnockbackDirection({ playerX: 140, sourceX: 120 })).toBe(1)
  })

  it('uses prototype hurt and defeat velocities', () => {
    expect(getPlayerHurtVelocity({ direction: -1, gravitySign: 1 })).toEqual({ x: -360, y: -360 })
    expect(getPlayerHurtVelocity({ direction: 1, gravitySign: -1 })).toEqual({ x: 360, y: 360 })
    expect(getPlayerDefeatOutcome({ reason: 'damage', gravitySign: 1 })).toEqual({ velocityY: -160 })
    expect(getPlayerDefeatOutcome({ reason: 'damage', gravitySign: -1 })).toEqual({ velocityY: 160 })
    expect(getPlayerDefeatOutcome({ reason: 'fall', gravitySign: 1 })).toEqual({ velocityY: 0 })
  })
})

describe('isPlayerOutsideWorldBounds', () => {
  const world = { worldWidth: 9600, worldHeight: 1080, margin: 128 }

  it('keeps players inside the expanded world bounds alive', () => {
    expect(isPlayerOutsideWorldBounds({ x: -128, y: 0, ...world })).toBe(false)
    expect(isPlayerOutsideWorldBounds({ x: 9600 + 128, y: 1080, ...world })).toBe(false)
  })

  it('detects leaving any side of the world bounds', () => {
    expect(isPlayerOutsideWorldBounds({ x: -129, y: 500, ...world })).toBe(true)
    expect(isPlayerOutsideWorldBounds({ x: 9600 + 129, y: 500, ...world })).toBe(true)
    expect(isPlayerOutsideWorldBounds({ x: 500, y: -129, ...world })).toBe(true)
    expect(isPlayerOutsideWorldBounds({ x: 500, y: 1080 + 129, ...world })).toBe(true)
  })
})
