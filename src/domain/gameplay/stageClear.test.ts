import { describe, expect, it } from 'vitest'
import { canCompleteStage, getStageClearState } from './stageClear'

describe('stage clear gate', () => {
  it('allows stage completion before the stage is cleared', () => {
    expect(canCompleteStage({ stageCleared: false })).toBe(true)
  })

  it('blocks duplicate stage completion after the stage is cleared', () => {
    expect(canCompleteStage({ stageCleared: true })).toBe(false)
  })

  it('blocks boss-stage completion until the boss is defeated', () => {
    expect(canCompleteStage({ stageCleared: false, bossDefeated: false })).toBe(false)
    expect(canCompleteStage({ stageCleared: false, bossDefeated: true })).toBe(true)
  })
})

describe('stage clear state', () => {
  it('returns the prototype clear-state transition values', () => {
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
