import { describe, expect, it } from 'vitest'
import { createInitialAppState } from '../../domain/app/appFlow'
import { applyTitleControlIntent, selectTitleMenuItemFromPointer } from './titleControls'

describe('applyTitleControlIntent', () => {
  it('opens the title menu from the intro', () => {
    expect(applyTitleControlIntent(createInitialAppState(), 'open')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })

  it('moves title menu selection up and down', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(applyTitleControlIntent(state, 'move-down')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
    })

    expect(applyTitleControlIntent(state, 'move-up')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 2 },
    })
  })

  it('confirms the selected title menu item', () => {
    const backSelected = { screen: { type: 'title-menu', selectedItemIndex: 2 } } as const

    expect(applyTitleControlIntent(backSelected, 'confirm')).toEqual({
      screen: { type: 'title-intro' },
    })
  })

  it('backs out of the title menu by activating the Back item', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(applyTitleControlIntent(state, 'back')).toEqual({
      screen: { type: 'title-intro' },
    })
  })

  it('ignores navigation intents while the intro is visible', () => {
    const state = createInitialAppState()

    expect(applyTitleControlIntent(state, 'move-down')).toBe(state)
    expect(applyTitleControlIntent(state, 'confirm')).toBe(state)
    expect(applyTitleControlIntent(state, 'back')).toBe(state)
  })

  it('selects title menu items from pointer input', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(selectTitleMenuItemFromPointer(state, 1)).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
    })
  })

  it('activates Back immediately when pointer input selects it', () => {
    const state = { screen: { type: 'title-menu', selectedItemIndex: 0 } } as const

    expect(selectTitleMenuItemFromPointer(state, 2)).toEqual({
      screen: { type: 'title-intro' },
    })
  })
})
