import { describe, expect, it } from 'vitest'

import { isPlayerGroundedByContact } from './groundRules'

describe('isPlayerGroundedByContact', () => {
  it('uses down contact while gravity points down', () => {
    expect(isPlayerGroundedByContact({
      direction: 'down',
      blockedDown: true,
      touchingDown: false,
      blockedUp: false,
      touchingUp: false,
    })).toBe(true)

    expect(isPlayerGroundedByContact({
      direction: 'down',
      blockedDown: false,
      touchingDown: true,
      blockedUp: false,
      touchingUp: false,
    })).toBe(true)
  })

  it('uses up contact while gravity points up', () => {
    expect(isPlayerGroundedByContact({
      direction: 'up',
      blockedDown: false,
      touchingDown: false,
      blockedUp: true,
      touchingUp: false,
    })).toBe(true)

    expect(isPlayerGroundedByContact({
      direction: 'up',
      blockedDown: false,
      touchingDown: false,
      blockedUp: false,
      touchingUp: true,
    })).toBe(true)
  })

  it('ignores the opposite contact side', () => {
    expect(isPlayerGroundedByContact({
      direction: 'down',
      blockedDown: false,
      touchingDown: false,
      blockedUp: true,
      touchingUp: true,
    })).toBe(false)

    expect(isPlayerGroundedByContact({
      direction: 'up',
      blockedDown: true,
      touchingDown: true,
      blockedUp: false,
      touchingUp: false,
    })).toBe(false)
  })
})
