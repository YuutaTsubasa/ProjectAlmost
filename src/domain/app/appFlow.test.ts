import { describe, expect, it } from 'vitest'
import {
  activateTitleMenuItem,
  backFromSettings,
  backFromWorldSelect,
  cancelDeleteConfirm,
  confirmSelectedWorld,
  createInitialAppState,
  moveSettingsDeleteConfirmSelection,
  moveSettingsScreenSelection,
  moveTitleMenuSelection,
  moveWorldSelection,
  openSettingsDeleteConfirm,
  openTitleMenu,
  selectTitleMenuItem,
  selectWorld,
} from './appFlow'

describe('createInitialAppState', () => {
  it('boots the rebuild into the title intro', () => {
    expect(createInitialAppState()).toEqual({
      screen: { type: 'title-intro' },
    })
  })
})

describe('openTitleMenu', () => {
  it('opens the title menu with the first item selected', () => {
    expect(openTitleMenu(createInitialAppState())).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })
})

describe('moveTitleMenuSelection', () => {
  it('wraps selection downward through title menu items', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 2 } } as const

    expect(moveTitleMenuSelection(state, 1)).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })

  it('wraps selection upward through title menu items', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(moveTitleMenuSelection(state, -1)).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 2 },
    })
  })

  it('does not move selection while in the title intro', () => {
    const state = createInitialAppState()

    expect(moveTitleMenuSelection(state, 1)).toBe(state)
  })
})

describe('selectTitleMenuItem', () => {
  it('selects a title menu item directly', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(selectTitleMenuItem(state, 2)).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 2 },
    })
  })

  it('does not select an item while in the title intro', () => {
    const state = createInitialAppState()

    expect(selectTitleMenuItem(state, 2)).toBe(state)
  })
})

describe('activateTitleMenuItem', () => {
  it('opens world select when Start Game is activated', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(activateTitleMenuItem(state)).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 0 },
    })
  })

  it('opens settings when Settings is activated', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 1 } } as const

    expect(activateTitleMenuItem(state)).toEqual({
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
    })
  })

  it('returns to the title intro when Back is activated', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 2 } } as const

    expect(activateTitleMenuItem(state)).toEqual({
      screen: { type: 'title-intro' },
    })
  })
})

describe('settings screen flow', () => {
  it('moves settings selection with wraparound', () => {
    expect(
      moveSettingsScreenSelection(
        { screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null } },
        -1,
      ),
    ).toEqual({
      screen: { type: 'settings', selectedItemIndex: 9, deleteConfirm: null },
    })
  })

  it('opens, moves, and cancels delete confirmation', () => {
    const settingsState = { screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null } } as const

    expect(openSettingsDeleteConfirm(settingsState)).toEqual({
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 } },
    })
    expect(
      moveSettingsDeleteConfirmSelection(
        { screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 } } },
        1,
      ),
    ).toEqual({
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 1 } },
    })
    expect(
      cancelDeleteConfirm({
        screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 1 } },
      }),
    ).toEqual({ screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null } })
  })

  it('returns from settings to title menu with Settings selected', () => {
    expect(backFromSettings({ screen: { type: 'settings', selectedItemIndex: 3, deleteConfirm: null } })).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
    })
  })
})

describe('moveWorldSelection', () => {
  it('wraps selection forward through worlds', () => {
    const state = { screen: { type: 'world-select', selectedWorldIndex: 5 } } as const

    expect(moveWorldSelection(state, 1)).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 0 },
    })
  })

  it('wraps selection backward through worlds', () => {
    const state = { screen: { type: 'world-select', selectedWorldIndex: 0 } } as const

    expect(moveWorldSelection(state, -1)).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 5 },
    })
  })

  it('does not move world selection outside world select', () => {
    const state = createInitialAppState()

    expect(moveWorldSelection(state, 1)).toBe(state)
  })
})

describe('selectWorld', () => {
  it('selects a world directly', () => {
    const state = { screen: { type: 'world-select', selectedWorldIndex: 0 } } as const

    expect(selectWorld(state, 3)).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 3 },
    })
  })

  it('does not select a world outside world select', () => {
    const state = createInitialAppState()

    expect(selectWorld(state, 3)).toBe(state)
  })
})

describe('confirmSelectedWorld', () => {
  it('preserves selected world until stage select exists', () => {
    const state = { screen: { type: 'world-select', selectedWorldIndex: 2 } } as const

    expect(confirmSelectedWorld(state)).toBe(state)
  })
})

describe('backFromWorldSelect', () => {
  it('returns from world select to the title menu', () => {
    const state = { screen: { type: 'world-select', selectedWorldIndex: 2 } } as const

    expect(backFromWorldSelect(state)).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })

  it('does not change state outside world select', () => {
    const state = createInitialAppState()

    expect(backFromWorldSelect(state)).toBe(state)
  })
})
