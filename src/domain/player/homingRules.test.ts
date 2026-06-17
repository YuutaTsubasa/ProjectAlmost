import { describe, expect, test } from 'vitest'
import {
  HOMING_ATTACK_CONTACT_DISTANCE,
  HOMING_ATTACK_RANGE,
  HOMING_TARGET_REVERSE_TOLERANCE_X,
  canStartHomingAttack,
  getHomingContactPoint,
  isHomingTargetEligible,
  selectNearestHomingTarget,
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

describe('selectNearestHomingTarget', () => {
  test('returns undefined for an empty candidate list', () => {
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [],
    })).toBeUndefined()
  })

  test('returns undefined when all candidates are ineligible', () => {
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'behind-far', targetX: 40, distance: 80 },
        { target: 'too-far', targetX: 220, distance: 361 },
      ],
    })).toBeUndefined()
  })

  test('returns the only eligible target', () => {
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'target-a', targetX: 180, distance: 120 },
      ],
    })).toBe('target-a')
  })

  test('returns the nearest eligible target', () => {
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'farther', targetX: 250, distance: 200 },
        { target: 'nearer', targetX: 180, distance: 90 },
      ],
    })).toBe('nearer')
  })

  test('ignores closer ineligible targets', () => {
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'behind-too-far', targetX: 40, distance: 40 },
        { target: 'eligible', targetX: 200, distance: 160 },
      ],
    })).toBe('eligible')
  })

  test('keeps the first eligible target when distances tie', () => {
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'first', targetX: 180, distance: 120 },
        { target: 'second', targetX: 190, distance: 120 },
      ],
    })).toBe('first')
  })
})

describe('getHomingContactPoint', () => {
  test('keeps the contact distance explicit', () => {
    expect(HOMING_ATTACK_CONTACT_DISTANCE).toBe(34)
  })

  test('places contact point behind a target to the right', () => {
    expect(getHomingContactPoint({
      startX: 0,
      startY: 0,
      targetX: 100,
      targetY: 0,
    })).toEqual({ x: 66, y: 0 })
  })

  test('places contact point behind a target to the left', () => {
    const contact = getHomingContactPoint({
      startX: 100,
      startY: 0,
      targetX: 0,
      targetY: 0,
    })

    expect(contact.x).toBeCloseTo(34)
    expect(contact.y).toBeCloseTo(0)
  })

  test('places contact point behind vertical targets', () => {
    const lowerContact = getHomingContactPoint({
      startX: 0,
      startY: 0,
      targetX: 0,
      targetY: 100,
    })
    const upperContact = getHomingContactPoint({
      startX: 0,
      startY: 100,
      targetX: 0,
      targetY: 0,
    })

    expect(lowerContact.x).toBeCloseTo(0)
    expect(lowerContact.y).toBeCloseTo(66)
    expect(upperContact.x).toBeCloseTo(0)
    expect(upperContact.y).toBeCloseTo(34)
  })

  test('places contact point behind diagonal targets', () => {
    const contact = getHomingContactPoint({
      startX: 0,
      startY: 0,
      targetX: 100,
      targetY: 100,
      contactDistance: 10,
    })

    const offset = Math.SQRT1_2 * 10
    expect(contact.x).toBeCloseTo(100 - offset)
    expect(contact.y).toBeCloseTo(100 - offset)
  })

  test('supports overriding contact distance', () => {
    expect(getHomingContactPoint({
      startX: 0,
      startY: 0,
      targetX: 100,
      targetY: 0,
      contactDistance: 10,
    })).toEqual({ x: 90, y: 0 })
  })
})
