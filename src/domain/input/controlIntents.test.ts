import { describe, expect, it } from 'vitest'
import { mapGamepadControlIntents, mapKeyboardControlIntent } from './controlIntents'

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
    const previous = { buttons: [], axes: [0, 0] }

    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, -0.7] }, 'world-select')).toEqual([
      'move-up',
    ])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0, 0.7] }, 'world-select')).toEqual([
      'move-down',
    ])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [-0.7, 0] }, 'world-select')).toEqual([
      'move-left',
    ])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0.7, 0] }, 'world-select')).toEqual([
      'move-right',
    ])
    expect(mapGamepadControlIntents(previous, { buttons: [], axes: [0.2, 0.2] }, 'world-select')).toEqual(
      [],
    )
  })

  it('emits intents only when buttons or axes move from inactive to active', () => {
    const previous = { buttons: [true, false, false, false], axes: [0.8, 0.8] }
    const current = { buttons: [true, false, false, false], axes: [0.9, 0.9] }

    expect(mapGamepadControlIntents(previous, current, 'world-select')).toEqual([])
  })

  it('returns no intents when current gamepad data is missing', () => {
    expect(mapGamepadControlIntents(null, null, 'world-select')).toEqual([])
  })
})
