import { describe, expect, it } from 'vitest'
import { canCompleteStage, getStageClearState } from './stageClearRules'

describe('canCompleteStage', () => {
  it('allows stage completion before the stage is cleared', () => {
    expect(canCompleteStage({ stageCleared: false })).toBe(true)
  })

  it('blocks duplicate stage completion after the stage is cleared', () => {
    expect(canCompleteStage({ stageCleared: true })).toBe(false)
  })
})

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
