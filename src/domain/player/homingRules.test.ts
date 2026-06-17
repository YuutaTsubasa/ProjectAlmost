import { describe, expect, test } from 'vitest'
import { canStartHomingAttack } from './homingRules'

describe('canStartHomingAttack', () => {
  test('allows homing attack only when attack is ready and player is active', () => {
    expect(canStartHomingAttack({
      attackReady: true,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toBe(true)
  })

  test('requires attack to be ready', () => {
    expect(canStartHomingAttack({
      attackReady: false,
      hurting: false,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  test('does not allow homing while hurting', () => {
    expect(canStartHomingAttack({
      attackReady: true,
      hurting: true,
      homingAttacking: false,
      dead: false,
    })).toBe(false)
  })

  test('does not allow homing while already homing attacking', () => {
    expect(canStartHomingAttack({
      attackReady: true,
      hurting: false,
      homingAttacking: true,
      dead: false,
    })).toBe(false)
  })

  test('does not allow homing while dead', () => {
    expect(canStartHomingAttack({
      attackReady: true,
      hurting: false,
      homingAttacking: false,
      dead: true,
    })).toBe(false)
  })
})
