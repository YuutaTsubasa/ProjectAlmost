import { describe, expect, it } from 'vitest'
import { mapGamepadControlIntents, mapKeyboardControlIntent, type GamepadControlSnapshot } from './controlIntents'

describe('mapKeyboardControlIntent', () => {
  it('maps any non-repeat key to open on the title intro', () => {
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'title-intro')).toBe('open')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'title-intro')).toBe('open')
  })

  it('maps title menu keys to vertical navigation, confirm, and back intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'w', repeat: false }, 'title-menu')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 's', repeat: false }, 'title-menu')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'title-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'title-menu')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'title-menu')).toBe('back')
  })

  it('maps world select keys to directional navigation, confirm, and back intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowRight', repeat: false }, 'world-select')).toBe(
      'move-right',
    )
    expect(mapKeyboardControlIntent({ key: 'd', repeat: false }, 'world-select')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: false }, 'world-select')).toBe(
      'move-down',
    )
    expect(mapKeyboardControlIntent({ key: 's', repeat: false }, 'world-select')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'ArrowLeft', repeat: false }, 'world-select')).toBe(
      'move-left',
    )
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'world-select')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'world-select')).toBe(
      'move-up',
    )
    expect(mapKeyboardControlIntent({ key: 'w', repeat: false }, 'world-select')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'world-select')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'world-select')).toBe('back')
  })

  it('maps settings keys to row navigation, adjustment, confirm, and back intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'settings')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'w', repeat: false }, 'settings')).toBe('move-up')
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: false }, 'settings')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 's', repeat: false }, 'settings')).toBe('move-down')
    expect(mapKeyboardControlIntent({ key: 'ArrowLeft', repeat: false }, 'settings')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'settings')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'ArrowRight', repeat: false }, 'settings')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'd', repeat: false }, 'settings')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'settings')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'settings')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'settings')).toBe('back')
  })

  it('maps delete confirmation keys to horizontal selection, confirm, and back intents', () => {
    expect(mapKeyboardControlIntent({ key: 'ArrowLeft', repeat: false }, 'settings-delete-confirm')).toBe(
      'move-left',
    )
    expect(mapKeyboardControlIntent({ key: 'ArrowRight', repeat: false }, 'settings-delete-confirm')).toBe(
      'move-right',
    )
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'settings-delete-confirm')).toBe('move-left')
    expect(mapKeyboardControlIntent({ key: 'd', repeat: false }, 'settings-delete-confirm')).toBe('move-right')
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: false }, 'settings-delete-confirm')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: ' ', repeat: false }, 'settings-delete-confirm')).toBe('confirm')
    expect(mapKeyboardControlIntent({ key: 'Escape', repeat: false }, 'settings-delete-confirm')).toBe('back')
    expect(mapKeyboardControlIntent({ key: 'ArrowUp', repeat: false }, 'settings-delete-confirm')).toBeNull()
  })

  it('ignores unsupported or repeated keys', () => {
    expect(mapKeyboardControlIntent({ key: 'a', repeat: false }, 'title-menu')).toBeNull()
    expect(mapKeyboardControlIntent({ key: 'ArrowDown', repeat: true }, 'world-select')).toBeNull()
    expect(mapKeyboardControlIntent({ key: 'Enter', repeat: true }, 'title-menu')).toBeNull()
  })
})

describe('mapGamepadControlIntents', () => {
  it('maps gamepad buttons to open, confirm, back, and d-pad directional intents', () => {
    const previous = {
      mapping: 'standard',
      buttons: Array.from({ length: 15 }, () => false),
      axes: [0, 0],
    }

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'title-intro'),
    ).toEqual(['open'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'title-menu'),
    ).toEqual(['confirm'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [true, false, false, false] }, 'settings'),
    ).toEqual(['confirm'])

    expect(
      mapGamepadControlIntents(previous, { ...previous, buttons: [false, true, false, false] }, 'world-select'),
    ).toEqual(['back'])

    expect(
      mapGamepadControlIntents(
        previous,
        { ...previous, buttons: [...previous.buttons.slice(0, 12), true] },
        'world-select',
      ),
    ).toEqual(['move-up'])

    expect(
      mapGamepadControlIntents(
        previous,
        { ...previous, buttons: [...previous.buttons.slice(0, 13), true] },
        'world-select',
      ),
    ).toEqual(['move-down'])

    expect(
      mapGamepadControlIntents(
        previous,
        { ...previous, buttons: [...previous.buttons.slice(0, 14), true] },
        'world-select',
      ),
    ).toEqual(['move-left'])

    expect(
      mapGamepadControlIntents(
        previous,
        { ...previous, buttons: [...previous.buttons.slice(0, 15), true] },
        'world-select',
      ),
    ).toEqual(['move-right'])
  })

  it('maps left stick threshold crossings to directional intents', () => {
    const previous = { mapping: 'standard', buttons: [], axes: [0, 0] }

    expect(
      mapGamepadControlIntents(previous, { mapping: 'standard', buttons: [], axes: [0, -0.7] }, 'world-select'),
    ).toEqual(['move-up'])
    expect(
      mapGamepadControlIntents(previous, { mapping: 'standard', buttons: [], axes: [0, 0.7] }, 'world-select'),
    ).toEqual(['move-down'])
    expect(
      mapGamepadControlIntents(previous, { mapping: 'standard', buttons: [], axes: [-0.7, 0] }, 'world-select'),
    ).toEqual(['move-left'])
    expect(
      mapGamepadControlIntents(previous, { mapping: 'standard', buttons: [], axes: [0.7, 0] }, 'world-select'),
    ).toEqual(['move-right'])
    expect(
      mapGamepadControlIntents(previous, { mapping: 'standard', buttons: [], axes: [0.2, 0.2] }, 'world-select'),
    ).toEqual([])
  })

  it('does not emit axis intents at exact thresholds', () => {
    const previous = { mapping: 'standard', buttons: [], axes: [0, 0] }

    expect(
      mapGamepadControlIntents(previous, { mapping: 'standard', buttons: [], axes: [0, -0.5] }, 'title-menu'),
    ).toEqual([])
    expect(
      mapGamepadControlIntents(previous, { mapping: 'standard', buttons: [], axes: [0, 0.5] }, 'title-menu'),
    ).toEqual([])
  })

  it('emits movement when axes cross from exact threshold boundaries', () => {
    const fromNegativeYBoundary = { mapping: 'standard', buttons: [], axes: [0, -0.5] }
    const fromPositiveYBoundary = { mapping: 'standard', buttons: [], axes: [0, 0.5] }
    const fromNegativeXBoundary = { mapping: 'standard', buttons: [], axes: [-0.5, 0] }
    const fromPositiveXBoundary = { mapping: 'standard', buttons: [], axes: [0.5, 0] }

    expect(
      mapGamepadControlIntents(
        fromNegativeYBoundary,
        { ...fromNegativeYBoundary, axes: [0, -0.7] },
        'world-select',
      ),
    ).toEqual(['move-up'])
    expect(
      mapGamepadControlIntents(
        fromPositiveYBoundary,
        { ...fromPositiveYBoundary, axes: [0, 0.7] },
        'world-select',
      ),
    ).toEqual(['move-down'])
    expect(
      mapGamepadControlIntents(
        fromNegativeXBoundary,
        { ...fromNegativeXBoundary, axes: [-0.7, 0] },
        'world-select',
      ),
    ).toEqual(['move-left'])
    expect(
      mapGamepadControlIntents(
        fromPositiveXBoundary,
        { ...fromPositiveXBoundary, axes: [0.7, 0] },
        'world-select',
      ),
    ).toEqual(['move-right'])
  })

  it('emits intents only when buttons or axes move from inactive to active', () => {
    const previous = { mapping: 'standard', buttons: [true, false, false, false], axes: [0.8, 0.8] }
    const current = { mapping: 'standard', buttons: [true, false, false, false], axes: [0.9, 0.9] }

    expect(mapGamepadControlIntents(previous, current, 'world-select')).toEqual([])
  })

  it('returns no intents when current gamepad data is missing', () => {
    expect(mapGamepadControlIntents(null, null, 'world-select')).toEqual([])
  })

  it('returns no intents when previous gamepad data is missing even if current is active', () => {
    const activeButtons = { mapping: 'standard', buttons: [true, false, false, false], axes: [0, 0] }
    const activeAxis = { mapping: 'standard', buttons: [false, false, false, false], axes: [0, -0.7] }

    expect(mapGamepadControlIntents(null, activeButtons, 'title-menu')).toEqual([])
    expect(mapGamepadControlIntents(null, activeAxis, 'title-menu')).toEqual([])
  })

  it('ignores unsupported gamepad mappings even when inputs are active', () => {
    const previous: GamepadControlSnapshot = {
      mapping: 'x-input',
      buttons: Array.from({ length: 15 }, () => false),
      axes: [0, 0],
    }
    const current: GamepadControlSnapshot = {
      mapping: 'x-input',
      buttons: [true, true, false, false, false, false, false, false, false, false, false, false, true],
      axes: [0, -0.7],
    }

    expect(mapGamepadControlIntents(previous, current, 'title-menu')).toEqual([])
  })

  it('ignores transitions from unsupported to standard gamepad mappings', () => {
    const previous: GamepadControlSnapshot = {
      mapping: 'x-input',
      buttons: Array.from({ length: 15 }, () => false),
      axes: [0, 0],
    }
    const current: GamepadControlSnapshot = {
      mapping: 'standard',
      buttons: [true, false, false, false],
      axes: [0, -0.7],
    }

    expect(mapGamepadControlIntents(previous, current, 'title-menu')).toEqual([])
  })
})
