import { describe, expect, it } from 'vitest'

import { getVerticalGravitySign } from './gravityRules'

describe('getVerticalGravitySign', () => {
  it('returns 1 for down gravity', () => {
    expect(getVerticalGravitySign({ direction: 'down' })).toBe(1)
  })

  it('returns -1 for up gravity', () => {
    expect(getVerticalGravitySign({ direction: 'up' })).toBe(-1)
  })
})
