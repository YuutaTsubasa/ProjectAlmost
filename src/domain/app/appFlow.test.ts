import { describe, expect, it } from 'vitest'
import {
  activateTitleMenuItem,
  backFromWorldSelect,
  confirmSelectedWorld,
  createInitialAppState,
  moveTitleMenuSelection,
  moveWorldSelection,
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

  it('keeps Settings inactive for now', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 1 } } as const

    expect(activateTitleMenuItem(state)).toBe(state)
  })

  it('returns to the title intro when Back is activated', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 2 } } as const

    expect(activateTitleMenuItem(state)).toEqual({
      screen: { type: 'title-intro' },
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
