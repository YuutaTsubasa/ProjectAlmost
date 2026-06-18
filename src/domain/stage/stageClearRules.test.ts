import { describe, expect, it } from 'vitest'
import { getStageClearState } from './stageClearRules'

describe('getStageClearState', () => {
  it('returns the stage clear state transition values', () => {
    expect(getStageClearState()).toEqual({
      stageCleared: true,
      attacking: false,
      homingAttacking: false,
      attackReady: false,
    })
  })

  it('returns a fresh state object', () => {
    const first = getStageClearState()
    const second = getStageClearState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})
