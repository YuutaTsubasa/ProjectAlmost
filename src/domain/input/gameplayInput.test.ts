import { describe, expect, it } from 'vitest'
import {
  clearVirtualControlsState,
  emptyGameplayInputSnapshot,
  getVirtualControlsVisibilityDecision,
  getVirtualStickInput,
  mapGamepadGameplayInputSnapshot,
  mergeGameplayInputSnapshots,
} from './gameplayInput'

describe('getVirtualStickInput', () => {
  it('maps horizontal drag beyond threshold to left and right movement', () => {
    expect(getVirtualStickInput({ x: -30, y: 0, radius: 100 }).moveX).toBe(-1)
    expect(getVirtualStickInput({ x: 30, y: 0, radius: 100 }).moveX).toBe(1)
  })

  it('ignores horizontal drift inside threshold', () => {
    expect(getVirtualStickInput({ x: 20, y: 0, radius: 100 })).toMatchObject({
      moveX: 0,
      crouchHeld: false,
    })
  })

  it('maps downward drag beyond threshold to crouch held', () => {
    expect(getVirtualStickInput({ x: 0, y: 60, radius: 100 })).toMatchObject({
      moveX: 0,
      crouchHeld: true,
    })
  })

  it('clamps knob movement to the stick radius', () => {
    expect(getVirtualStickInput({ x: 300, y: 0, radius: 100 }).knob).toEqual({ x: 100, y: 0 })
  })
})

describe('virtual controls state', () => {
  it('hides and clears movement/crouch state when reset', () => {
    expect(clearVirtualControlsState({ visible: true, moveX: 1, crouchHeld: true })).toEqual({
      visible: false,
      moveX: 0,
      crouchHeld: false,
    })
  })

  it('shows for pointer gameplay input and hides for keyboard or gamepad gameplay input', () => {
    expect(getVirtualControlsVisibilityDecision({ visible: false, source: 'virtual-pointer', playable: true })).toEqual({
      visible: true,
      resetVirtualState: false,
    })
    expect(getVirtualControlsVisibilityDecision({ visible: true, source: 'keyboard', playable: true })).toEqual({
      visible: false,
      resetVirtualState: true,
    })
    expect(getVirtualControlsVisibilityDecision({ visible: true, source: 'gamepad', playable: true })).toEqual({
      visible: false,
      resetVirtualState: true,
    })
  })

  it('does not show virtual controls when gameplay is not playable', () => {
    expect(getVirtualControlsVisibilityDecision({ visible: false, source: 'virtual-pointer', playable: false })).toEqual({
      visible: false,
      resetVirtualState: true,
    })
  })
})

describe('mergeGameplayInputSnapshots', () => {
  it('combines held movement with edge-triggered jump and attack presses', () => {
    expect(mergeGameplayInputSnapshots([
      { ...emptyGameplayInputSnapshot, leftHeld: true },
      { ...emptyGameplayInputSnapshot, jumpPressed: true, jumpHeld: true },
      { ...emptyGameplayInputSnapshot, attackPressed: true, attackHeld: true },
    ])).toEqual({
      leftHeld: true,
      rightHeld: false,
      crouchHeld: false,
      jumpPressed: true,
      jumpHeld: true,
      attackPressed: true,
      attackHeld: true,
      pausePressed: false,
    })
  })
})

describe('mapGamepadGameplayInputSnapshot', () => {
  const idle = {
    mapping: 'standard',
    buttons: Array.from({ length: 16 }, () => false),
    axes: [0, 0],
  }

  it('maps standard gamepad movement, crouch, jump, attack, and pause', () => {
    const current = {
      mapping: 'standard',
      buttons: idle.buttons.map((pressed, index) => index === 0 || index === 1 || index === 2 || index === 15 || pressed),
      axes: [0.7, 0.7],
    }

    expect(mapGamepadGameplayInputSnapshot(idle, current)).toEqual({
      leftHeld: false,
      rightHeld: true,
      crouchHeld: true,
      jumpPressed: true,
      jumpHeld: true,
      attackPressed: true,
      attackHeld: true,
      pausePressed: true,
    })
  })

  it('does not repeat jump and attack presses while held', () => {
    const held = {
      mapping: 'standard',
      buttons: idle.buttons.map((pressed, index) => index === 0 || index === 2 || pressed),
      axes: [0, 0],
    }

    expect(mapGamepadGameplayInputSnapshot(held, held)).toMatchObject({
      jumpPressed: false,
      jumpHeld: true,
      attackPressed: false,
      attackHeld: true,
    })
  })

  it('returns an empty snapshot for missing or unsupported gamepad data', () => {
    expect(mapGamepadGameplayInputSnapshot(null, null)).toEqual(emptyGameplayInputSnapshot)
    expect(mapGamepadGameplayInputSnapshot(idle, { ...idle, mapping: 'x-input' })).toEqual(emptyGameplayInputSnapshot)
  })
})
