import { describe, expect, it } from 'vitest'
import { applyControlIntent } from './appControls'

describe('applyControlIntent', () => {
  it('opens the title menu from the title intro', () => {
    expect(applyControlIntent({ screen: { type: 'title-intro' } }, 'open')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })

  it('moves, confirms, and backs out of the title menu', () => {
    expect(applyControlIntent({ screen: { type: 'title-menu', selectedItemIndex: 0 } }, 'move-down')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
    })
    expect(applyControlIntent({ screen: { type: 'title-menu', selectedItemIndex: 0 } }, 'move-up')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 2 },
    })
    expect(applyControlIntent({ screen: { type: 'title-menu', selectedItemIndex: 0 } }, 'confirm')).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 0 },
    })
    expect(applyControlIntent({ screen: { type: 'title-menu', selectedItemIndex: 0 } }, 'back')).toEqual({
      screen: { type: 'title-intro' },
    })
  })

  it('moves, confirms, and backs out of world select', () => {
    expect(applyControlIntent({ screen: { type: 'world-select', selectedWorldIndex: 0 } }, 'move-right')).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 1 },
    })
    expect(applyControlIntent({ screen: { type: 'world-select', selectedWorldIndex: 0 } }, 'move-down')).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 1 },
    })
    expect(applyControlIntent({ screen: { type: 'world-select', selectedWorldIndex: 0 } }, 'move-left')).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 5 },
    })
    expect(applyControlIntent({ screen: { type: 'world-select', selectedWorldIndex: 0 } }, 'move-up')).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 5 },
    })

    const worldState = { screen: { type: 'world-select', selectedWorldIndex: 3 } } as const

    expect(applyControlIntent(worldState, 'confirm')).toBe(worldState)
    expect(applyControlIntent(worldState, 'back')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })
})
