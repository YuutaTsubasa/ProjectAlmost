import { describe, expect, it } from 'vitest'
import { canApplyPlayerEnemyHit } from './hurtRules'

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
