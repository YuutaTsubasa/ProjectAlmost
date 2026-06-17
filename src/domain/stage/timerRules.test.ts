import { describe, expect, it } from 'vitest'
import { shouldAdvanceStageTimer } from './timerRules'

describe('shouldAdvanceStageTimer', () => {
  it('advances when the timer has started and gameplay is active', () => {
    expect(shouldAdvanceStageTimer({
      timerStarted: true,
      stageCleared: false,
      dead: false,
    })).toBe(true)
  })

  it('does not advance before the timer has started', () => {
    expect(shouldAdvanceStageTimer({
      timerStarted: false,
      stageCleared: false,
      dead: false,
    })).toBe(false)
  })

  it('does not advance after stage clear', () => {
    expect(shouldAdvanceStageTimer({
      timerStarted: true,
      stageCleared: true,
      dead: false,
    })).toBe(false)
  })

  it('does not advance while dead', () => {
    expect(shouldAdvanceStageTimer({
      timerStarted: true,
      stageCleared: false,
      dead: true,
    })).toBe(false)
  })
})
