import { describe, expect, it } from 'vitest'
import { formatStageTimer, getStageInputArmedState, shouldAdvanceStageTimer, shouldStartStageAction } from './timerRules'

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

describe('shouldStartStageAction', () => {
  it('does not start stage action after the timer has already started', () => {
    expect(shouldStartStageAction({
      timerStarted: true,
      left: true,
      right: false,
      crouchHeld: false,
      jumpPressed: false,
      attackPressed: false,
    })).toBe(false)
  })

  it('does not start stage action without gameplay input', () => {
    expect(shouldStartStageAction({
      timerStarted: false,
      left: false,
      right: false,
      crouchHeld: false,
      jumpPressed: false,
      attackPressed: false,
    })).toBe(false)
  })

  it.each([
    ['left', { left: true }],
    ['right', { right: true }],
    ['crouch', { crouchHeld: true }],
    ['jump', { jumpPressed: true }],
    ['attack', { attackPressed: true }],
  ])('starts stage action from %s input', (_label, activeInput) => {
    expect(shouldStartStageAction({
      timerStarted: false,
      left: false,
      right: false,
      crouchHeld: false,
      jumpPressed: false,
      attackPressed: false,
      ...activeInput,
    })).toBe(true)
  })
})

describe('getStageInputArmedState', () => {
  it('keeps stage input armed once armed', () => {
    expect(getStageInputArmedState({
      stageInputArmed: true,
      gameplayInputHeld: true,
    })).toBe(true)
  })

  it('keeps stage input unarmed while gameplay input is held', () => {
    expect(getStageInputArmedState({
      stageInputArmed: false,
      gameplayInputHeld: true,
    })).toBe(false)
  })

  it('arms stage input once gameplay input is released', () => {
    expect(getStageInputArmedState({
      stageInputArmed: false,
      gameplayInputHeld: false,
    })).toBe(true)
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
