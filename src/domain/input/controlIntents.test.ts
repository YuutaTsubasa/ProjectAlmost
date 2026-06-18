import { describe, expect, it } from 'vitest'
import { mapKeyboardControlIntent } from './controlIntents'

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
