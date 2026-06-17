import { describe, expect, test } from 'vitest'
import {
  HOMING_ATTACK_RANGE,
  HOMING_TARGET_REVERSE_TOLERANCE_X,
  canStartHomingAttack,
  isHomingTargetEligible,
} from './homingRules'

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

describe('isHomingTargetEligible', () => {
  test('keeps homing target constants explicit', () => {
    expect(HOMING_ATTACK_RANGE).toBe(360)
    expect(HOMING_TARGET_REVERSE_TOLERANCE_X).toBe(48)
  })

  test('allows targets on the exact range boundary when facing them', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 200,
      facing: 1,
      distance: 360,
    })).toBe(true)
  })

  test('rejects targets beyond range', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 200,
      facing: 1,
      distance: 361,
    })).toBe(false)
  })

  test('allows targets in the facing direction while in range', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 180,
      facing: 1,
      distance: 120,
    })).toBe(true)
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 20,
      facing: -1,
      distance: 120,
    })).toBe(true)
  })

  test('rejects targets behind the player beyond reverse tolerance', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 51,
      facing: 1,
      distance: 80,
    })).toBe(false)
  })

  test('allows targets behind the player on the reverse tolerance boundary', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 52,
      facing: 1,
      distance: 80,
    })).toBe(true)
  })

  test('rejects targets behind the player just outside reverse tolerance', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 151,
      facing: -1,
      distance: 80,
    })).toBe(false)
  })

  test('allows same-x targets as facing direction while in range', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 100,
      facing: -1,
      distance: 80,
    })).toBe(true)
  })

  test('supports explicit range and reverse tolerance for boundary checks', () => {
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 80,
      facing: 1,
      distance: 50,
      range: 50,
      reverseToleranceX: 20,
    })).toBe(true)
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 79,
      facing: 1,
      distance: 50,
      range: 50,
      reverseToleranceX: 20,
    })).toBe(false)
    expect(isHomingTargetEligible({
      playerX: 100,
      targetX: 200,
      facing: 1,
      distance: 51,
      range: 50,
      reverseToleranceX: 20,
    })).toBe(false)
  })
})
