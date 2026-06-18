import { describe, expect, test } from 'vitest'
import {
  HOMING_ATTACK_CONTACT_DISTANCE,
  HOMING_ATTACK_BOUNCE_Y,
  HOMING_ATTACK_RANGE,
  HOMING_LINE_COIN_COLLECTION_RADIUS,
  HOMING_TARGET_REVERSE_TOLERANCE_X,
  HOMING_TRAIL_SPACING,
  canShowHomingReticle,
  canStartHomingAttack,
  getHomingAttackEntryState,
  getHomingContactPoint,
  getHomingFinishOutcome,
  getHomingLineCoinCollectionDecision,
  getHomingRecoveryState,
  getHomingTrailSamples,
  isPointCollectableByHomingLine,
  isHomingTargetLost,
  isHomingTargetEligible,
  selectNearestHomingTarget,
  shouldUpdateHomingAttack,
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

describe('getHomingAttackEntryState', () => {
  test('returns Homing Attack entry state', () => {
    expect(getHomingAttackEntryState()).toEqual({
      attackReady: false,
      attacking: true,
      homingAttacking: true,
    })
  })

  test('returns a fresh state object', () => {
    const first = getHomingAttackEntryState()
    const second = getHomingAttackEntryState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe('shouldUpdateHomingAttack', () => {
  test('updates only while Homing Attack is active and a target exists', () => {
    expect(shouldUpdateHomingAttack({
      homingAttacking: true,
      hasTarget: true,
    })).toBe(true)
  })

  test('does not update when Homing Attack is not active', () => {
    expect(shouldUpdateHomingAttack({
      homingAttacking: false,
      hasTarget: true,
    })).toBe(false)
  })

  test('does not update without a Homing target', () => {
    expect(shouldUpdateHomingAttack({
      homingAttacking: true,
      hasTarget: false,
    })).toBe(false)
  })
})

describe('canShowHomingReticle', () => {
  test('allows reticle search when no blocking state is active', () => {
    expect(canShowHomingReticle({
      grounded: false,
      stageCleared: false,
      dead: false,
      attacking: false,
      hurting: false,
      homingAttacking: false,
    })).toBe(true)
  })

  test('blocks reticle while grounded', () => {
    expect(canShowHomingReticle({
      grounded: true,
      stageCleared: false,
      dead: false,
      attacking: false,
      hurting: false,
      homingAttacking: false,
    })).toBe(false)
  })

  test('blocks reticle after stage clear', () => {
    expect(canShowHomingReticle({
      grounded: false,
      stageCleared: true,
      dead: false,
      attacking: false,
      hurting: false,
      homingAttacking: false,
    })).toBe(false)
  })

  test('blocks reticle after player death', () => {
    expect(canShowHomingReticle({
      grounded: false,
      stageCleared: false,
      dead: true,
      attacking: false,
      hurting: false,
      homingAttacking: false,
    })).toBe(false)
  })

  test('blocks reticle while attacking', () => {
    expect(canShowHomingReticle({
      grounded: false,
      stageCleared: false,
      dead: false,
      attacking: true,
      hurting: false,
      homingAttacking: false,
    })).toBe(false)
  })

  test('blocks reticle while hurting', () => {
    expect(canShowHomingReticle({
      grounded: false,
      stageCleared: false,
      dead: false,
      attacking: false,
      hurting: true,
      homingAttacking: false,
    })).toBe(false)
  })

  test('blocks reticle during Homing Attack', () => {
    expect(canShowHomingReticle({
      grounded: false,
      stageCleared: false,
      dead: false,
      attacking: false,
      hurting: false,
      homingAttacking: true,
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

describe('getHomingLineCoinCollectionDecision', () => {
  test('skips collected coins even on the Homing line', () => {
    expect(getHomingLineCoinCollectionDecision({
      collected: true,
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 50,
      pointY: 0,
    })).toBe('skip')
  })

  test('collects uncollected coins within the Homing line radius', () => {
    expect(getHomingLineCoinCollectionDecision({
      collected: false,
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 50,
      pointY: HOMING_LINE_COIN_COLLECTION_RADIUS - 1,
    })).toBe('collect')
  })

  test('collects uncollected coins on the exact Homing line radius boundary', () => {
    expect(getHomingLineCoinCollectionDecision({
      collected: false,
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 50,
      pointY: HOMING_LINE_COIN_COLLECTION_RADIUS,
    })).toBe('collect')
  })

  test('skips uncollected coins outside the Homing line radius', () => {
    expect(getHomingLineCoinCollectionDecision({
      collected: false,
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 50,
      pointY: HOMING_LINE_COIN_COLLECTION_RADIUS + 1,
    })).toBe('skip')
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

describe('getHomingFinishOutcome', () => {
  test('keeps the Homing hit bounce velocity explicit', () => {
    expect(HOMING_ATTACK_BOUNCE_Y).toBe(-420)
  })

  test('returns hit outcome for normal gravity', () => {
    expect(getHomingFinishOutcome({
      hit: true,
      gravitySign: 1,
    })).toEqual({
      remainingAirJumps: 1,
      velocityY: -420,
      statusKey: 'status.homingHit',
    })
  })

  test('uses gravity sign for hit bounce velocity', () => {
    expect(getHomingFinishOutcome({
      hit: true,
      gravitySign: -1,
    })).toEqual({
      remainingAirJumps: 1,
      velocityY: 420,
      statusKey: 'status.homingHit',
    })
  })

  test('returns miss outcome without resetting air jumps', () => {
    expect(getHomingFinishOutcome({
      hit: false,
      gravitySign: 1,
    })).toEqual({
      velocityY: 0,
      statusKey: 'status.homingMiss',
    })
  })
})

describe('getHomingRecoveryState', () => {
  test('ends attack and restores readiness when player is not hurting', () => {
    expect(getHomingRecoveryState({ hurting: false })).toEqual({
      attacking: false,
      attackReady: true,
    })
  })

  test('ends attack without overwriting readiness while player is hurting', () => {
    expect(getHomingRecoveryState({ hurting: true })).toEqual({
      attacking: false,
    })
  })

  test('returns a fresh state object', () => {
    const first = getHomingRecoveryState({ hurting: false })
    const second = getHomingRecoveryState({ hurting: false })

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe('isHomingTargetLost', () => {
  test('treats defeated targets as lost', () => {
    expect(isHomingTargetLost({
      defeated: true,
      active: true,
      visible: true,
    })).toBe(true)
  })

  test('treats inactive targets as lost', () => {
    expect(isHomingTargetLost({
      defeated: false,
      active: false,
      visible: true,
    })).toBe(true)
  })

  test('treats invisible targets as lost', () => {
    expect(isHomingTargetLost({
      defeated: false,
      active: true,
      visible: false,
    })).toBe(true)
  })

  test('keeps undefeated active visible targets usable', () => {
    expect(isHomingTargetLost({
      defeated: false,
      active: true,
      visible: true,
    })).toBe(false)
  })
})

describe('isPointCollectableByHomingLine', () => {
  test('keeps the homing line coin collection radius explicit', () => {
    expect(HOMING_LINE_COIN_COLLECTION_RADIUS).toBe(52)
  })

  test('collects points on the homing line segment', () => {
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 50,
      pointY: 0,
    })).toBe(true)
  })

  test('collects points on the exact radius boundary', () => {
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 50,
      pointY: 52,
    })).toBe(true)
  })

  test('rejects points outside the collection radius', () => {
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 50,
      pointY: 53,
    })).toBe(false)
  })

  test('uses clamped segment endpoints for points before the start and after the end', () => {
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: -20,
      pointY: 20,
    })).toBe(true)
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: 120,
      pointY: 20,
    })).toBe(true)
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      pointX: -60,
      pointY: 0,
    })).toBe(false)
  })

  test('supports diagonal homing lines', () => {
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      pointX: 55,
      pointY: 45,
      radius: 8,
    })).toBe(true)
    expect(isPointCollectableByHomingLine({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      pointX: 70,
      pointY: 30,
      radius: 8,
    })).toBe(false)
  })

  test('treats zero-length lines as a point at the start', () => {
    expect(isPointCollectableByHomingLine({
      startX: 10,
      startY: 10,
      endX: 10,
      endY: 10,
      pointX: 10,
      pointY: 62,
    })).toBe(true)
    expect(isPointCollectableByHomingLine({
      startX: 10,
      startY: 10,
      endX: 10,
      endY: 10,
      pointX: 10,
      pointY: 63,
    })).toBe(false)
  })
})

describe('getHomingTrailSamples', () => {
  test('keeps homing trail spacing explicit', () => {
    expect(HOMING_TRAIL_SPACING).toBe(28)
  })

  test('creates at least two samples for a zero-length trail', () => {
    expect(getHomingTrailSamples({
      startX: 10,
      startY: 20,
      endX: 10,
      endY: 20,
    })).toEqual([
      { x: 10, y: 20, progress: 0, alpha: 0.42 },
      { x: 10, y: 20, progress: 0.5, alpha: 0.42 * (1 - 0.5 * 0.35) },
    ])
  })

  test('uses ceil distance over spacing for sample count', () => {
    const samples = getHomingTrailSamples({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      spacing: 28,
    })

    expect(samples).toHaveLength(4)
    expect(samples.map((sample) => sample.progress)).toEqual([0, 0.25, 0.5, 0.75])
    expect(samples.map((sample) => sample.x)).toEqual([0, 25, 50, 75])
    expect(samples.map((sample) => sample.y)).toEqual([0, 0, 0, 0])
  })

  test('interpolates diagonal sample positions', () => {
    const samples = getHomingTrailSamples({
      startX: 10,
      startY: 20,
      endX: 50,
      endY: 100,
      spacing: 40,
    })

    expect(samples).toHaveLength(3)
    expect(samples[1]?.x).toBeCloseTo(10 + 40 / 3)
    expect(samples[1]?.y).toBeCloseTo(20 + 80 / 3)
    expect(samples[2]?.x).toBeCloseTo(10 + 80 / 3)
    expect(samples[2]?.y).toBeCloseTo(20 + 160 / 3)
  })

  test('calculates alpha from each sample progress', () => {
    const samples = getHomingTrailSamples({
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      spacing: 28,
    })

    expect(samples[0]?.alpha).toBeCloseTo(0.42)
    expect(samples[1]?.alpha).toBeCloseTo(0.42 * (1 - 0.25 * 0.35))
    expect(samples[2]?.alpha).toBeCloseTo(0.42 * (1 - 0.5 * 0.35))
    expect(samples[3]?.alpha).toBeCloseTo(0.42 * (1 - 0.75 * 0.35))
  })
})
