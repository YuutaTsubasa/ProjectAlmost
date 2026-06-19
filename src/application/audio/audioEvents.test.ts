import { describe, expect, it } from 'vitest'
import type { AppScreen } from '../../domain/app/appFlow'
import { getControlIntentSfxAction } from './audioEvents'

describe('getControlIntentSfxAction', () => {
  it('maps opening the title menu to confirm sfx', () => {
    expect(getControlIntentSfxAction({ type: 'title-intro' }, { type: 'title-menu', selectedItemIndex: 0 }, 'open')).toBe(
      'confirm',
    )
  })

  it('maps selection changes to move sfx', () => {
    expect(
      getControlIntentSfxAction(
        { type: 'title-menu', selectedItemIndex: 0 },
        { type: 'title-menu', selectedItemIndex: 1 },
        'move-down',
      ),
    ).toBe('move')
    expect(
      getControlIntentSfxAction(
        { type: 'world-select', selectedWorldIndex: 0 },
        { type: 'world-select', selectedWorldIndex: 1 },
        'move-right',
      ),
    ).toBe('move')
    expect(
      getControlIntentSfxAction(
        { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
        { type: 'settings', selectedItemIndex: 1, deleteConfirm: null },
        'move-down',
      ),
    ).toBe('move')
  })

  it('maps confirm and back intents to matching sfx when state changes or action is valid', () => {
    expect(
      getControlIntentSfxAction(
        { type: 'title-menu', selectedItemIndex: 0 },
        { type: 'world-select', selectedWorldIndex: 0 },
        'confirm',
      ),
    ).toBe('confirm')
    expect(
      getControlIntentSfxAction(
        { type: 'world-select', selectedWorldIndex: 0 },
        { type: 'title-menu', selectedItemIndex: 0 },
        'back',
      ),
    ).toBe('back')
  })

  it('does not emit movement sfx for unchanged screens', () => {
    const screen: AppScreen = { type: 'title-menu', selectedItemIndex: 0 }

    expect(getControlIntentSfxAction(screen, screen, 'move-down')).toBeNull()
  })
})
