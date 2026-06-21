import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../../domain/settings/settings'
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

    expect(applyControlIntent(worldState, 'confirm')).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 3, worldId: 'world04', selectedStageIndex: 0 },
    })
    expect(applyControlIntent(worldState, 'back')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 0 },
    })
  })

  it('moves, confirms, and backs out of stage select', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 0 },
    } as const

    expect(applyControlIntent(state, 'move-right')).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 1 },
    })
    expect(applyControlIntent(state, 'move-down')).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 1 },
    })
    expect(applyControlIntent(state, 'move-left')).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 5 },
    })
    expect(applyControlIntent(state, 'move-up')).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 2, worldId: 'world03', selectedStageIndex: 5 },
    })
    expect(applyControlIntent(state, 'confirm')).toEqual({
      screen: { type: 'gameplay', stageId: '3-1' },
    })
    expect(applyControlIntent(state, 'back')).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 2 },
    })
  })

  it('moves, adjusts, activates, and backs out of settings', () => {
    const settingsState = {
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
      settings: DEFAULT_SETTINGS,
    } as const

    expect(applyControlIntent(settingsState, 'move-down')).toEqual({
      ...settingsState,
      screen: { type: 'settings', selectedItemIndex: 1, deleteConfirm: null },
    })
    expect(applyControlIntent(settingsState, 'move-up')).toEqual({
      ...settingsState,
      screen: { type: 'settings', selectedItemIndex: 9, deleteConfirm: null },
    })
    expect(applyControlIntent(settingsState, 'move-right')).toEqual({
      ...settingsState,
      settings: { ...DEFAULT_SETTINGS, masterVolume: 100 },
    })
    expect(applyControlIntent(settingsState, 'move-left')).toEqual({
      ...settingsState,
      settings: { ...DEFAULT_SETTINGS, masterVolume: 90 },
    })
    expect(
      applyControlIntent(
        { ...settingsState, screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null } },
        'confirm',
      ),
    ).toEqual({
      ...settingsState,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 } },
    })
    expect(applyControlIntent(settingsState, 'back')).toEqual({
      screen: { type: 'title-menu', selectedItemIndex: 1 },
      settings: DEFAULT_SETTINGS,
    })
  })

  it('handles delete confirmation controls in settings', () => {
    const state = {
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 0 as const } },
      settings: DEFAULT_SETTINGS,
    } as const

    expect(applyControlIntent(state, 'move-right')).toEqual({
      ...state,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: { selectedActionIndex: 1 } },
    })
    expect(applyControlIntent(state, 'back')).toEqual({
      ...state,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null },
    })
    expect(applyControlIntent(state, 'confirm')).toEqual({
      ...state,
      screen: { type: 'settings', selectedItemIndex: 8, deleteConfirm: null },
    })
  })
})
