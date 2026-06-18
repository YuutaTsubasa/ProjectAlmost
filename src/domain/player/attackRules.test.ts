import { describe, expect, test } from 'vitest'
import {
  MELEE_HITBOX_FORWARD_OFFSET_X,
  MELEE_HITBOX_OFFSET_Y,
  canStartMeleeAttack,
  getMeleeAttackEndState,
  getMeleeAttackEntryState,
  getMeleeAttackReadyState,
  getMeleeHitboxGeometry,
} from './attackRules'

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

describe('getMeleeAttackEntryState', () => {
  test('returns melee attack entry state', () => {
    expect(getMeleeAttackEntryState()).toEqual({
      attackReady: false,
      attacking: true,
    })
  })

  test('returns a fresh state object', () => {
    const first = getMeleeAttackEntryState()
    const second = getMeleeAttackEntryState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe('getMeleeAttackEndState', () => {
  test('returns melee attack end state', () => {
    expect(getMeleeAttackEndState()).toEqual({
      attacking: false,
    })
  })

  test('returns a fresh state object', () => {
    const first = getMeleeAttackEndState()
    const second = getMeleeAttackEndState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe('getMeleeAttackReadyState', () => {
  test('returns melee attack ready recovery state', () => {
    expect(getMeleeAttackReadyState()).toEqual({
      attackReady: true,
    })
  })

  test('returns a fresh state object', () => {
    const first = getMeleeAttackReadyState()
    const second = getMeleeAttackReadyState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})

describe('getMeleeHitboxGeometry', () => {
  test('keeps melee hitbox offsets explicit', () => {
    expect(MELEE_HITBOX_FORWARD_OFFSET_X).toBe(48)
    expect(MELEE_HITBOX_OFFSET_Y).toBe(-4)
  })

  test('places hitbox to the right when player is not flipped', () => {
    expect(getMeleeHitboxGeometry({
      playerX: 100,
      playerY: 200,
      playerFlipX: false,
    })).toEqual({
      x: 148,
      y: 196,
      direction: 1,
      flipX: false,
    })
  })

  test('places and flips hitbox to the left when player is flipped', () => {
    expect(getMeleeHitboxGeometry({
      playerX: 100,
      playerY: 200,
      playerFlipX: true,
    })).toEqual({
      x: 52,
      y: 196,
      direction: -1,
      flipX: true,
    })
  })
})
