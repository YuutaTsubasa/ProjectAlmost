import { describe, expect, it } from 'vitest'
import { getCoinTargetCount } from './coinRules'

describe('getCoinTargetCount', () => {
  it('returns zero when a stage has no coins', () => {
    expect(getCoinTargetCount({ coins: [] })).toBe(0)
  })

  it('returns the number of coin entries', () => {
    expect(getCoinTargetCount({
      coins: [
        { x: 100 },
        { x: 250 },
        { x: 400 },
      ],
    })).toBe(3)
  })
})
