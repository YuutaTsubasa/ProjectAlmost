import { describe, expect, it } from 'vitest'
import { canApplyPlayerEnemyHit, canApplyPlayerHazardHit } from './hurtRules'

describe('canApplyPlayerEnemyHit', () => {
  it('allows enemy contact damage when no blocking state is active', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(true)
  })

  it('blocks enemy contact damage while invulnerable', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: true,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage while already hurting', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: true,
      enemyDefeated: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage from defeated enemies', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: true,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage during Homing Attack', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: true,
      dead: false,
    })).toBe(false)
  })

  it('blocks enemy contact damage after player death', () => {
    expect(canApplyPlayerEnemyHit({
      invulnerable: false,
      hurting: false,
      enemyDefeated: false,
      homingAttacking: false,
      dead: true,
    })).toBe(false)
  })
})

describe('canApplyPlayerHazardHit', () => {
  it('allows hazard contact damage when no blocking state is active', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
      stageCleared: false,
    })).toBe(true)
  })

  it('blocks hazard contact damage while invulnerable', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: true,
      hurting: false,
      homingAttacking: false,
      dead: false,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage while already hurting', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: true,
      homingAttacking: false,
      dead: false,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage during Homing Attack', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: true,
      dead: false,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage after player death', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: true,
      stageCleared: false,
    })).toBe(false)
  })

  it('blocks hazard contact damage after stage clear', () => {
    expect(canApplyPlayerHazardHit({
      invulnerable: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
      stageCleared: true,
    })).toBe(false)
  })
})
