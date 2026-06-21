import { describe, expect, it } from 'vitest'
import {
  getAttackInputDecision,
  canStartMeleeAttack,
  getMeleeAttackEntryState,
  getMeleeAttackEndState,
  getMeleeAttackReadyState,
  getMeleeHitboxGeometry,
  isMeleeHitCandidate,
  meleeAttackTiming,
} from './playerAttack'

describe('getAttackInputDecision', () => {
  it('does not attack without a fresh attack press', () => {
    expect(getAttackInputDecision({ attackPressed: false, crouching: false, grounded: true })).toBe('none')
  })

  it('does not attack while crouching', () => {
    expect(getAttackInputDecision({ attackPressed: true, crouching: true, grounded: true })).toBe('none')
  })

  it('uses melee for grounded and airborne presses until homing attack exists in the rebuild', () => {
    expect(getAttackInputDecision({ attackPressed: true, crouching: false, grounded: true })).toBe('melee')
    expect(getAttackInputDecision({ attackPressed: true, crouching: false, grounded: false })).toBe('melee')
  })
})

describe('canStartMeleeAttack', () => {
  it('requires attack readiness and blocks hurt or homing states', () => {
    expect(canStartMeleeAttack({ attackReady: true, hurting: false, homingAttacking: false })).toBe(true)
    expect(canStartMeleeAttack({ attackReady: false, hurting: false, homingAttacking: false })).toBe(false)
    expect(canStartMeleeAttack({ attackReady: true, hurting: true, homingAttacking: false })).toBe(false)
    expect(canStartMeleeAttack({ attackReady: true, hurting: false, homingAttacking: true })).toBe(false)
  })
})

describe('melee attack state transitions', () => {
  it('matches prototype attack readiness transitions and timing', () => {
    expect(getMeleeAttackEntryState()).toEqual({ attackReady: false, attacking: true })
    expect(getMeleeAttackEndState()).toEqual({ attacking: false })
    expect(getMeleeAttackReadyState()).toEqual({ attackReady: true })
    expect(meleeAttackTiming).toEqual({
      hitboxLifetimeMs: 120,
      attackEndDelayMs: 340,
      readyDelayMs: 360,
    })
  })
})

describe('getMeleeHitboxGeometry', () => {
  it('places a forward hitbox while facing right', () => {
    expect(getMeleeHitboxGeometry({ playerX: 100, playerY: 200, playerFlipX: false })).toEqual({
      x: 148,
      y: 196,
      width: 56,
      height: 36,
      flipX: false,
    })
  })

  it('places a forward hitbox while facing left', () => {
    expect(getMeleeHitboxGeometry({ playerX: 100, playerY: 200, playerFlipX: true })).toEqual({
      x: 52,
      y: 196,
      width: 56,
      height: 36,
      flipX: true,
    })
  })
})

describe('isMeleeHitCandidate', () => {
  it('only allows active intersecting enemies to be hit', () => {
    expect(isMeleeHitCandidate({ defeated: false, intersectsHitbox: true })).toBe(true)
    expect(isMeleeHitCandidate({ defeated: true, intersectsHitbox: true })).toBe(false)
    expect(isMeleeHitCandidate({ defeated: false, intersectsHitbox: false })).toBe(false)
  })
})
