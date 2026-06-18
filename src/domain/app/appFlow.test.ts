import { describe, expect, it } from 'vitest'
import {
  activateTitleMenuItem,
  createInitialAppState,
  moveTitleMenuSelection,
  openTitleMenu,
  selectTitleMenuItem,
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
  it('keeps Start Game inactive for now', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(activateTitleMenuItem(state)).toBe(state)
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
