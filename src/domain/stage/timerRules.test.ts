import { describe, expect, it } from 'vitest'
import { formatStageTimer, shouldAdvanceStageTimer } from './timerRules'

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

describe('formatStageTimer', () => {
  it.each([
    [0, '00:00.00'],
    [9, '00:00.00'],
    [10, '00:00.01'],
    [999, '00:00.99'],
    [1000, '00:01.00'],
    [60_000, '01:00.00'],
    [14_830, '00:14.83'],
  ])('formats %ims as %s', (elapsedMs, expected) => {
    expect(formatStageTimer({ elapsedMs })).toBe(expected)
  })
})
