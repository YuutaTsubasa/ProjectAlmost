import { describe, expect, it } from 'vitest'
import {
  HOMING_ATTACK_BOUNCE_Y,
  HOMING_ATTACK_CONTACT_DISTANCE,
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
  getHomingTargetAcquisitionDecision,
  getHomingTrailSamples,
  homingAttackPresentation,
  homingAttackTiming,
  isHomingTargetAvailable,
  isHomingTargetEligible,
  isHomingTargetLost,
  isPointCollectableByHomingLine,
  selectNearestHomingTarget,
  shouldUpdateHomingAttack,
} from './playerHomingAttack'

describe('player Homing Attack constants', () => {
  it('keeps prototype Homing values explicit', () => {
    expect(HOMING_ATTACK_RANGE).toBe(360)
    expect(HOMING_TARGET_REVERSE_TOLERANCE_X).toBe(48)
    expect(HOMING_ATTACK_CONTACT_DISTANCE).toBe(34)
    expect(HOMING_ATTACK_BOUNCE_Y).toBe(-420)
    expect(HOMING_LINE_COIN_COLLECTION_RADIUS).toBe(52)
    expect(HOMING_TRAIL_SPACING).toBe(28)
    expect(homingAttackTiming).toEqual({
      recoveryDelayMs: 220,
      trailHoldMs: 70,
      trailFadeMs: 260,
    })
    expect(homingAttackPresentation).toEqual({
      reticleTextureKey: 'homing-reticle',
      reticleSize: 48,
      reticleYOffset: -8,
      attackFrame: 2,
      trailTint: 0x4be8ff,
      trailAlphaBase: 0.42,
      trailAlphaProgressReduction: 0.35,
    })
  })
})

describe('canStartHomingAttack', () => {
  it('allows only ready active players to start Homing', () => {
    expect(canStartHomingAttack({ attackReady: true, hurting: false, homingAttacking: false, dead: false })).toBe(true)
    expect(canStartHomingAttack({ attackReady: false, hurting: false, homingAttacking: false, dead: false })).toBe(false)
    expect(canStartHomingAttack({ attackReady: true, hurting: true, homingAttacking: false, dead: false })).toBe(false)
    expect(canStartHomingAttack({ attackReady: true, hurting: false, homingAttacking: true, dead: false })).toBe(false)
    expect(canStartHomingAttack({ attackReady: true, hurting: false, homingAttacking: false, dead: true })).toBe(false)
  })
})

describe('Homing state transitions', () => {
  it('enters, updates, acquires, finishes, and recovers like the prototype', () => {
    expect(getHomingAttackEntryState()).toEqual({ attackReady: false, attacking: true, homingAttacking: true })
    expect(shouldUpdateHomingAttack({ homingAttacking: true, hasTarget: true })).toBe(true)
    expect(shouldUpdateHomingAttack({ homingAttacking: false, hasTarget: true })).toBe(false)
    expect(shouldUpdateHomingAttack({ homingAttacking: true, hasTarget: false })).toBe(false)
    expect(getHomingTargetAcquisitionDecision({ hasTarget: true })).toBe('start')
    expect(getHomingTargetAcquisitionDecision({ hasTarget: false })).toBe('fail')
    expect(getHomingFinishOutcome({ hit: true, gravitySign: 1 })).toEqual({
      remainingAirJumps: 1,
      velocityY: -420,
      statusKey: 'status.homingHit',
    })
    expect(getHomingFinishOutcome({ hit: true, gravitySign: -1 })).toEqual({
      remainingAirJumps: 1,
      velocityY: 420,
      statusKey: 'status.homingHit',
    })
    expect(getHomingFinishOutcome({ hit: false, gravitySign: 1 })).toEqual({
      velocityY: 0,
      statusKey: 'status.homingMiss',
    })
    expect(getHomingRecoveryState({ hurting: false })).toEqual({ attacking: false, attackReady: true })
    expect(getHomingRecoveryState({ hurting: true })).toEqual({ attacking: false })
  })
})

describe('canShowHomingReticle', () => {
  it('shows only while airborne and unblocked', () => {
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: false, hurting: false, homingAttacking: false })).toBe(true)
    expect(canShowHomingReticle({ grounded: true, dead: false, attacking: false, hurting: false, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: true, attacking: false, hurting: false, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: true, hurting: false, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: false, hurting: true, homingAttacking: false })).toBe(false)
    expect(canShowHomingReticle({ grounded: false, dead: false, attacking: false, hurting: false, homingAttacking: true })).toBe(false)
  })
})

describe('Homing target selection', () => {
  it('filters availability and target loss', () => {
    expect(isHomingTargetAvailable({ defeated: false, active: true, visible: true })).toBe(true)
    expect(isHomingTargetAvailable({ defeated: true, active: true, visible: true })).toBe(false)
    expect(isHomingTargetAvailable({ defeated: false, active: false, visible: true })).toBe(false)
    expect(isHomingTargetAvailable({ defeated: false, active: true, visible: false })).toBe(false)
    expect(isHomingTargetLost({ defeated: true, active: true, visible: true })).toBe(true)
    expect(isHomingTargetLost({ defeated: false, active: true, visible: true })).toBe(false)
  })

  it('honors range, facing direction, and reverse tolerance', () => {
    expect(isHomingTargetEligible({ playerX: 100, targetX: 200, facing: 1, distance: 360 })).toBe(true)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 200, facing: 1, distance: 361 })).toBe(false)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 51, facing: 1, distance: 80 })).toBe(false)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 52, facing: 1, distance: 80 })).toBe(true)
    expect(isHomingTargetEligible({ playerX: 100, targetX: 100, facing: -1, distance: 80 })).toBe(true)
  })

  it('selects the nearest eligible target and keeps first tie', () => {
    expect(selectNearestHomingTarget({ playerX: 100, facing: 1, candidates: [] })).toBeUndefined()
    expect(selectNearestHomingTarget({
      playerX: 100,
      facing: 1,
      candidates: [
        { target: 'behind-too-far', targetX: 40, distance: 40 },
        { target: 'eligible', targetX: 200, distance: 160 },
        { target: 'closer', targetX: 180, distance: 90 },
      ],
    })).toBe('closer')
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

describe('Homing geometry and trail', () => {
  it('calculates contact points around targets', () => {
    expect(getHomingContactPoint({ startX: 0, startY: 0, targetX: 100, targetY: 0 })).toEqual({ x: 66, y: 0 })
    expect(getHomingContactPoint({ startX: 0, startY: 0, targetX: 100, targetY: 0, contactDistance: 10 })).toEqual({ x: 90, y: 0 })
    const diagonal = getHomingContactPoint({ startX: 0, startY: 0, targetX: 100, targetY: 100, contactDistance: 10 })
    expect(diagonal.x).toBeCloseTo(100 - Math.SQRT1_2 * 10)
    expect(diagonal.y).toBeCloseTo(100 - Math.SQRT1_2 * 10)
  })

  it('collects points along a Homing line as a pure helper', () => {
    expect(isPointCollectableByHomingLine({ startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 52 })).toBe(true)
    expect(isPointCollectableByHomingLine({ startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 53 })).toBe(false)
    expect(getHomingLineCoinCollectionDecision({ collected: true, startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 0 })).toBe('skip')
    expect(getHomingLineCoinCollectionDecision({ collected: false, startX: 0, startY: 0, endX: 100, endY: 0, pointX: 50, pointY: 0 })).toBe('collect')
  })

  it('creates trail samples with prototype spacing and alpha falloff', () => {
    const samples = getHomingTrailSamples({ startX: 0, startY: 0, endX: 100, endY: 0, spacing: 28 })

    expect(samples).toHaveLength(4)
    expect(samples.map((sample) => sample.progress)).toEqual([0, 0.25, 0.5, 0.75])
    expect(samples.map((sample) => sample.x)).toEqual([0, 25, 50, 75])
    expect(samples[0]?.alpha).toBeCloseTo(0.42)
    expect(samples[3]?.alpha).toBeCloseTo(0.42 * (1 - 0.75 * 0.35))
  })
})
