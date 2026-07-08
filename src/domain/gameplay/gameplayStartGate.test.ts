import { describe, expect, it } from 'vitest'
import {
  advanceGameplayStartGate,
  createInitialGameplayStartGateState,
  isGameplayStartGateRunning,
  type GameplayStartInputSnapshot,
} from './gameplayStartGate'

const idleInput: GameplayStartInputSnapshot = {
  leftHeld: false,
  rightHeld: false,
  crouchHeld: false,
  jumpPressed: false,
  jumpHeld: false,
  attackPressed: false,
  attackHeld: false,
}

describe('gameplay start gate', () => {
  it('starts unarmed so held entry input cannot start gameplay', () => {
    expect(createInitialGameplayStartGateState()).toEqual({ status: 'waiting-unarmed' })
  })

  it('stays unarmed while gameplay input is held', () => {
    expect(advanceGameplayStartGate(
      { status: 'waiting-unarmed' },
      { ...idleInput, leftHeld: true },
    )).toEqual({ status: 'waiting-unarmed' })
  })

  it('arms after all gameplay input has been released', () => {
    expect(advanceGameplayStartGate({ status: 'waiting-unarmed' }, idleInput)).toEqual({
      status: 'waiting-armed',
    })
  })

  it.each([
    ['left', { leftHeld: true }],
    ['right', { rightHeld: true }],
    ['crouch', { crouchHeld: true }],
    ['jump press', { jumpPressed: true }],
    ['jump hold', { jumpHeld: true }],
    ['attack press', { attackPressed: true }],
    ['attack hold', { attackHeld: true }],
  ])('starts from armed when %s input is active', (_label, input) => {
    expect(advanceGameplayStartGate(
      { status: 'waiting-armed' },
      { ...idleInput, ...input },
    )).toEqual({ status: 'running' })
  })

  it('does not start from armed without gameplay input', () => {
    expect(advanceGameplayStartGate({ status: 'waiting-armed' }, idleInput)).toEqual({
      status: 'waiting-armed',
    })
  })

  it('keeps running once gameplay has started', () => {
    expect(advanceGameplayStartGate({ status: 'running' }, idleInput)).toEqual({
      status: 'running',
    })
    expect(isGameplayStartGateRunning({ status: 'running' })).toBe(true)
    expect(isGameplayStartGateRunning({ status: 'waiting-armed' })).toBe(false)
  })
})
