import { describe, expect, test } from 'vitest'
import {
  MELEE_HITBOX_FORWARD_OFFSET_X,
  MELEE_HITBOX_OFFSET_Y,
  canStartMeleeAttack,
  getAttackInputDecision,
  getMeleeAttackEndState,
  getMeleeAttackEntryState,
  getMeleeAttackReadyState,
  getMeleeHitboxGeometry,
  isMeleeHitCandidate,
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

describe('getAttackInputDecision', () => {
  test('ignores frames without an attack press', () => {
    expect(getAttackInputDecision({
      attackPressed: false,
      crouching: false,
      grounded: true,
    })).toBe('none')
  })

  test('ignores attack presses while crouching', () => {
    expect(getAttackInputDecision({
      attackPressed: true,
      crouching: true,
      grounded: true,
    })).toBe('none')
  })

  test('uses melee directly for grounded attack presses', () => {
    expect(getAttackInputDecision({
      attackPressed: true,
      crouching: false,
      grounded: true,
    })).toBe('melee')
  })

  test('tries homing before melee for airborne attack presses', () => {
    expect(getAttackInputDecision({
      attackPressed: true,
      crouching: false,
      grounded: false,
    })).toBe('homing-then-melee')
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

describe('isMeleeHitCandidate', () => {
  test('accepts non-defeated enemies that intersect the melee hitbox', () => {
    expect(isMeleeHitCandidate({
      defeated: false,
      intersectsHitbox: true,
    })).toBe(true)
  })

  test('rejects defeated enemies even when they intersect the melee hitbox', () => {
    expect(isMeleeHitCandidate({
      defeated: true,
      intersectsHitbox: true,
    })).toBe(false)
  })

  test('rejects non-intersecting enemies', () => {
    expect(isMeleeHitCandidate({
      defeated: false,
      intersectsHitbox: false,
    })).toBe(false)
  })
})
