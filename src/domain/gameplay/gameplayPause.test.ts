import { describe, expect, it } from 'vitest'
import {
  PAUSE_MENU_ITEMS,
  activatePauseMenuItem,
  backFromPauseSettings,
  movePauseMenuSelection,
  openPauseMenu,
  openPauseSettings,
  resumePauseMenu,
  selectPauseMenuItem,
  type GameplayPauseState,
} from './gameplayPause'

describe('gameplay pause menu domain', () => {
  it('declares the prototype pause menu item order', () => {
    expect(PAUSE_MENU_ITEMS).toEqual(['resume', 'restart-stage', 'settings', 'stage-select'])
  })

  it('opens pause from playing with Resume selected', () => {
    expect(openPauseMenu({ mode: 'playing' })).toEqual({ mode: 'paused', selectedItemIndex: 0 })
  })

  it('does not reopen pause when already paused or in pause settings', () => {
    const paused: GameplayPauseState = { mode: 'paused', selectedItemIndex: 2 }
    const settings: GameplayPauseState = { mode: 'settings', selectedItemIndex: 3 }

    expect(openPauseMenu(paused)).toBe(paused)
    expect(openPauseMenu(settings)).toBe(settings)
  })

  it('resumes from paused or pause settings back to playing', () => {
    expect(resumePauseMenu({ mode: 'paused', selectedItemIndex: 0 })).toEqual({ mode: 'playing' })
    expect(resumePauseMenu({ mode: 'settings', selectedItemIndex: 2 })).toEqual({ mode: 'playing' })
  })

  it('wraps pause menu selection up and down', () => {
    expect(movePauseMenuSelection({ mode: 'paused', selectedItemIndex: 0 }, -1)).toEqual({
      mode: 'paused',
      selectedItemIndex: 3,
    })
    expect(movePauseMenuSelection({ mode: 'paused', selectedItemIndex: 3 }, 1)).toEqual({
      mode: 'paused',
      selectedItemIndex: 0,
    })
  })

  it('ignores movement outside the paused menu', () => {
    const state: GameplayPauseState = { mode: 'playing' }

    expect(movePauseMenuSelection(state, 1)).toBe(state)
  })

  it('bounds direct pause menu selection to valid items', () => {
    expect(selectPauseMenuItem({ mode: 'paused', selectedItemIndex: 0 }, 2)).toEqual({
      mode: 'paused',
      selectedItemIndex: 2,
    })
    expect(selectPauseMenuItem({ mode: 'paused', selectedItemIndex: 0 }, -1)).toEqual({
      mode: 'paused',
      selectedItemIndex: 0,
    })
    expect(selectPauseMenuItem({ mode: 'paused', selectedItemIndex: 0 }, 4)).toEqual({
      mode: 'paused',
      selectedItemIndex: 0,
    })
  })

  it('activates pause menu items into pure actions', () => {
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 0 })).toEqual({
      state: { mode: 'playing' },
      action: 'resume',
    })
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 1 })).toEqual({
      state: { mode: 'playing' },
      action: 'restart-stage',
    })
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 2 })).toEqual({
      state: { mode: 'settings', selectedItemIndex: 2 },
      action: 'open-settings',
    })
    expect(activatePauseMenuItem({ mode: 'paused', selectedItemIndex: 3 })).toEqual({
      state: { mode: 'playing' },
      action: 'stage-select',
    })
  })

  it('returns from pause-origin settings with Settings selected', () => {
    expect(backFromPauseSettings({ mode: 'settings', selectedItemIndex: 1 })).toEqual({
      mode: 'paused',
      selectedItemIndex: 2,
    })
  })

  it('opens pause settings from the paused menu preserving Settings selection', () => {
    expect(openPauseSettings({ mode: 'paused', selectedItemIndex: 0 })).toEqual({
      mode: 'settings',
      selectedItemIndex: 2,
    })
  })
})
