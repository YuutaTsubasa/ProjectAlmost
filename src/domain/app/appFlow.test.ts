import { describe, expect, it } from 'vitest'
import {
  activateTitleMenuItem,
  backFromSettings,
  backFromStageSelect,
  backFromWorldSelect,
  cancelDeleteConfirm,
  confirmSelectedStage,
  confirmSelectedWorld,
  createInitialAppState,
  moveSettingsDeleteConfirmSelection,
  moveSettingsScreenSelection,
  moveStageSelection,
  moveTitleMenuSelection,
  moveWorldSelection,
  openNextGameplayStage,
  openSettingsDeleteConfirm,
  openTitleMenu,
  getGameplayScreenKey,
  retryGameplayStage,
  returnFromGameplayToStageSelect,
  selectStage,
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
  it('opens stage select for the selected world with the first stage selected', () => {
    const state = { screen: { type: 'world-select', selectedWorldIndex: 2 } } as const

    expect(confirmSelectedWorld(state)).toEqual({
      screen: {
        type: 'stage-select',
        selectedWorldIndex: 2,
        worldId: 'world03',
        selectedStageIndex: 0,
      },
    })
  })

  it('does not change state outside world select', () => {
    const state = createInitialAppState()

    expect(confirmSelectedWorld(state)).toBe(state)
  })
})

describe('moveStageSelection', () => {
  it('wraps selection forward through stages in the selected world', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 5 },
    } as const

    expect(moveStageSelection(state, 1)).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 0 },
    })
  })

  it('wraps selection backward through stages in the selected world', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 0 },
    } as const

    expect(moveStageSelection(state, -1)).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 0, worldId: 'world01', selectedStageIndex: 5 },
    })
  })

  it('does not move stage selection outside stage select', () => {
    const state = createInitialAppState()

    expect(moveStageSelection(state, 1)).toBe(state)
  })
})

describe('selectStage', () => {
  it('selects a stage directly while preserving the selected world', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 4, worldId: 'world05', selectedStageIndex: 0 },
    } as const

    expect(selectStage(state, 3)).toEqual({
      screen: { type: 'stage-select', selectedWorldIndex: 4, worldId: 'world05', selectedStageIndex: 3 },
    })
  })

  it('does not select a stage outside stage select', () => {
    const state = createInitialAppState()

    expect(selectStage(state, 3)).toBe(state)
  })
})

describe('confirmSelectedStage', () => {
  it('opens gameplay for the selected stage', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 1, worldId: 'world02', selectedStageIndex: 4 },
    } as const

    expect(confirmSelectedStage(state)).toEqual({
      screen: { type: 'gameplay', stageId: '2-5', runId: 0 },
    })
  })

  it('does not open gameplay outside stage select', () => {
    const state = createInitialAppState()

    expect(confirmSelectedStage(state)).toBe(state)
  })
})

describe('stage unlock guarded app flow', () => {
  it('does not open gameplay when the selected stage is locked', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 1, worldId: 'world02', selectedStageIndex: 4 },
    } as const

    expect(confirmSelectedStage(state, { isStageUnlocked: () => false })).toBe(state)
  })

  it('opens gameplay when the selected stage is unlocked', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 1, worldId: 'world02', selectedStageIndex: 4 },
    } as const

    expect(confirmSelectedStage(state, { isStageUnlocked: (stageId) => stageId === '2-5' })).toEqual({
      screen: { type: 'gameplay', stageId: '2-5', runId: 0 },
    })
  })

  it('opens the next gameplay stage when it exists and is unlocked', () => {
    const state = { screen: { type: 'gameplay', stageId: '1-1', runId: 3 } } as const

    expect(openNextGameplayStage(state, '1-2', { isStageUnlocked: (stageId) => stageId === '1-2' })).toEqual({
      screen: { type: 'gameplay', stageId: '1-2', runId: 4 },
    })
  })

  it('does not open the next gameplay stage when it is locked or missing', () => {
    const state = { screen: { type: 'gameplay', stageId: '1-1', runId: 3 } } as const

    expect(openNextGameplayStage(state, '1-2', { isStageUnlocked: () => false })).toBe(state)
    expect(openNextGameplayStage(state, null, { isStageUnlocked: () => true })).toBe(state)
  })
})

describe('gameplay result flow', () => {
  it('retries the current gameplay stage with a remount token', () => {
    const state = { screen: { type: 'gameplay', stageId: '1-1', runId: 0 } } as const
    const retried = retryGameplayStage(state)

    expect(retried).toEqual({
      screen: { type: 'gameplay', stageId: '1-1', runId: 1 },
    })
    expect(getGameplayScreenKey(state.screen)).toBe('1-1:0')
    if (retried.screen.type !== 'gameplay') {
      throw new Error('expected gameplay screen after retry')
    }
    expect(getGameplayScreenKey(retried.screen)).toBe('1-1:1')
  })

  it('returns from gameplay to the matching stage select entry', () => {
    expect(returnFromGameplayToStageSelect({ screen: { type: 'gameplay', stageId: '1-1', runId: 2 } })).toEqual({
      screen: {
        type: 'stage-select',
        selectedWorldIndex: 0,
        worldId: 'world01',
        selectedStageIndex: 0,
      },
    })
  })
})

describe('backFromStageSelect', () => {
  it('returns to world select with the originating world selected', () => {
    const state = {
      screen: { type: 'stage-select', selectedWorldIndex: 3, worldId: 'world04', selectedStageIndex: 2 },
    } as const

    expect(backFromStageSelect(state)).toEqual({
      screen: { type: 'world-select', selectedWorldIndex: 3 },
    })
  })

  it('does not change state outside stage select', () => {
    const state = createInitialAppState()

    expect(backFromStageSelect(state)).toBe(state)
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
