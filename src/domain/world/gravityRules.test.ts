import { describe, expect, it } from 'vitest'

import {
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
