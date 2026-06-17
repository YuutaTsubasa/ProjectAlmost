import { describe, expect, test } from 'vitest'
import { canStartMeleeAttack } from './attackRules'

describe('canStartMeleeAttack', () => {
  test('allows melee attack when attack is ready and player is not locked', () => {
    expect(canStartMeleeAttack({
      attackReady: true,
      hurting: false,
      homingAttacking: false,
    })).toBe(true)
  })

  test('requires attack to be ready', () => {
    expect(canStartMeleeAttack({
      attackReady: false,
      hurting: false,
      homingAttacking: false,
    })).toBe(false)
  })

  test('rejects melee attack while hurting', () => {
    expect(canStartMeleeAttack({
      attackReady: true,
      hurting: true,
      homingAttacking: false,
    })).toBe(false)
  })

  test('rejects melee attack during homing attack', () => {
    expect(canStartMeleeAttack({
      attackReady: true,
      hurting: false,
      homingAttacking: true,
    })).toBe(false)
  })
})
