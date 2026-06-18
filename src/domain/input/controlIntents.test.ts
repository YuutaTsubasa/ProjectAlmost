import { describe, expect, it } from 'vitest'
import { mapGamepadControlIntents, mapKeyboardControlIntent } from './controlIntents'

describe('mapKeyboardControlIntent', () => {
  it('maps any non-repeat key to open while waiting on the title intro', () => {
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'title-intro')).toBe('open')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'title-intro')).toBe('open')
  })

  it('maps supported title menu keys to navigation intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'w', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'W', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 's', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'S', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'title-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'title-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'title-menu')).toBe('back')
  })

  it('ignores unsupported or repeated title menu keys', () => {
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'title-menu')).toBeNull()
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: true }, 'title-menu')).toBeNull()
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: true }, 'title-menu')).toBeNull()
  })
})

describe('mapGamepadControlIntents', () => {
  it('maps gamepad buttons to open, confirm, back, and directional intents', () => {
    const previous = {
      buttons: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      axes: [0, 0],
    }

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'title-intro'),
    ).toEqual(['open'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'title-menu'),
    ).toEqual(['confirm'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [false, true, false, false] }, 'title-menu'),
    ).toEqual(['back'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [...previous.buttons.slice(0, 12), true] }, 'title-menu'),
    ).toEqual(['move-up'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [...previous.buttons.slice(0, 13), true] }, 'title-menu'),
    ).toEqual(['move-down'])
  })

  it('maps left stick threshold crossings to directional intents', () => {
    const previous = { buttons: [], axes: [0, 0] }

    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, -0.7] }, 'title-menu')).toEqual(['move-up'])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, 0.7] }, 'title-menu')).toEqual(['move-down'])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, 0.2] }, 'title-menu')).toEqual([])
  })

  it('does not emit axis intents at exact thresholds', () => {
    const previous = { buttons: [], axes: [0, 0] }

    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, -0.5] }, 'title-menu')).toEqual([])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, 0.5] }, 'title-menu')).toEqual([])
  })

  it('emits intents only when buttons or axes move from inactive to active', () => {
    const previous = { buttons: [true, false, false, false], axes: [0, 0.8] }
    const current = { buttons: [true, false, false, false], axes: [0, 0.9] }

    expect(mapGamepadControlIntents(previous, current, 'title-menu')).toEqual([])
  })

  it('returns no intents when current gamepad data is missing', () => {
    expect(mapGamepadControlIntents(null, null, 'title-menu')).toEqual([])
  })
})
