import { describe, expect, it } from 'vitest'

import {
  findActiveGravityZone,
  getPlayerBodyGravityY,
  getVerticalGravitySign,
  shouldFlipPlayerYForGravity,
} from './gravityRules'

describe('getVerticalGravitySign', () => {
  it('returns 1 for down gravity', () => {
    expect(getVerticalGravitySign({ direction: 'down' })).toBe(1)
  })

  it('returns -1 for up gravity', () => {
    expect(getVerticalGravitySign({ direction: 'up' })).toBe(-1)
  })
})

describe('getPlayerBodyGravityY', () => {
  it('returns 0 for down gravity', () => {
    expect(getPlayerBodyGravityY({
      direction: 'down',
      worldGravityY: 1500,
    })).toBe(0)
  })

  it('returns twice the negative world gravity for up gravity', () => {
    expect(getPlayerBodyGravityY({
      direction: 'up',
      worldGravityY: 1500,
    })).toBe(-3000)
  })
})

describe('shouldFlipPlayerYForGravity', () => {
  it('does not flip the player for down gravity', () => {
    expect(shouldFlipPlayerYForGravity({ direction: 'down' })).toBe(false)
  })

  it('flips the player for up gravity', () => {
    expect(shouldFlipPlayerYForGravity({ direction: 'up' })).toBe(true)
  })
})

describe('findActiveGravityZone', () => {
  const zones = [
    { id: 'first', x: 10, y: 20, width: 100, height: 50, direction: 'up' as const },
    { id: 'second', x: 50, y: 40, width: 100, height: 50, direction: 'down' as const },
  ]

  it('returns the first zone containing the point', () => {
    expect(findActiveGravityZone({
      pointX: 60,
      pointY: 45,
      zones,
    })?.id).toBe('first')
  })

  it('uses inclusive zone edges', () => {
    expect(findActiveGravityZone({
      pointX: 110,
      pointY: 70,
      zones,
    })?.id).toBe('first')
  })

  it('returns undefined when no zone contains the point', () => {
    expect(findActiveGravityZone({
      pointX: 9,
      pointY: 20,
      zones,
    })).toBeUndefined()
  })
})
