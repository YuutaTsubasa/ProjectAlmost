import {
  moveDeleteConfirmSelection,
  moveSettingsSelection,
  openDeleteConfirm,
  type DeleteConfirmState,
} from '../settings/settings'

export const TITLE_MENU_ITEMS = ['start', 'settings', 'back'] as const

export type TitleMenuItem = (typeof TITLE_MENU_ITEMS)[number]

export type TitleMenuScreen = {
  type: 'title-menu'
  selectedItemIndex: number
}

export type WorldSelectScreen = {
  type: 'world-select'
  selectedWorldIndex: number
}

export type SettingsScreen = {
  type: 'settings'
  selectedItemIndex: number
  deleteConfirm: DeleteConfirmState | null
}

export type AppScreen = { type: 'title-intro' } | TitleMenuScreen | WorldSelectScreen | SettingsScreen

export type AppState = {
  screen: AppScreen
}

const WORLD_COUNT = 6

export function createInitialAppState(): AppState {
  return {
    screen: { type: 'title-intro' },
  }
}

export function openTitleMenu(state: AppState): AppState {
  if (state.screen.type === 'title-menu') return state

  return {
    screen: { type: 'title-menu', selectedItemIndex: 0 },
  }
}

export function moveTitleMenuSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'title-menu') return state

  const itemCount = TITLE_MENU_ITEMS.length
  const selectedItemIndex = (state.screen.selectedItemIndex + direction + itemCount) % itemCount

  return {
    screen: { type: 'title-menu', selectedItemIndex },
  }
}

export function selectTitleMenuItem(state: AppState, selectedItemIndex: number): AppState {
  if (state.screen.type !== 'title-menu') return state

  return {
    screen: { type: 'title-menu', selectedItemIndex },
  }
}

export function activateTitleMenuItem(state: AppState): AppState {
  if (state.screen.type !== 'title-menu') return state

  const selectedItem = TITLE_MENU_ITEMS[state.screen.selectedItemIndex]
  if (selectedItem === 'start') {
    return {
      screen: { type: 'world-select', selectedWorldIndex: 0 },
    }
  }

  if (selectedItem === 'settings') {
    return {
      screen: { type: 'settings', selectedItemIndex: 0, deleteConfirm: null },
    }
  }

  if (selectedItem !== 'back') return state

  return createInitialAppState()
}

export function moveWorldSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'world-select') return state

  const selectedWorldIndex = (state.screen.selectedWorldIndex + direction + WORLD_COUNT) % WORLD_COUNT

  return {
    screen: { type: 'world-select', selectedWorldIndex },
  }
}

export function selectWorld(state: AppState, selectedWorldIndex: number): AppState {
  if (state.screen.type !== 'world-select') return state

  return {
    screen: { type: 'world-select', selectedWorldIndex },
  }
}

export function confirmSelectedWorld(state: AppState): AppState {
  if (state.screen.type !== 'world-select') return state

  return state
}

export function backFromWorldSelect(state: AppState): AppState {
  if (state.screen.type !== 'world-select') return state

  return {
    screen: { type: 'title-menu', selectedItemIndex: 0 },
  }
}

export function moveSettingsScreenSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'settings' || state.screen.deleteConfirm) return state

  return {
    screen: {
      ...state.screen,
      selectedItemIndex: moveSettingsSelection(state.screen.selectedItemIndex, direction),
    },
  }
}

export function openSettingsDeleteConfirm(state: AppState): AppState {
  if (state.screen.type !== 'settings') return state

  return {
    screen: {
      ...state.screen,
      deleteConfirm: openDeleteConfirm(),
    },
  }
}

export function moveSettingsDeleteConfirmSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'settings' || !state.screen.deleteConfirm) return state

  return {
    screen: {
      ...state.screen,
      deleteConfirm: {
        selectedActionIndex: moveDeleteConfirmSelection(
          state.screen.deleteConfirm.selectedActionIndex,
          direction,
        ),
      },
    },
  }
}

export function cancelDeleteConfirm(state: AppState): AppState {
  if (state.screen.type !== 'settings' || !state.screen.deleteConfirm) return state

  return {
    screen: {
      ...state.screen,
      deleteConfirm: null,
    },
  }
}

export function backFromSettings(state: AppState): AppState {
  if (state.screen.type !== 'settings') return state
  if (state.screen.deleteConfirm) return cancelDeleteConfirm(state)

  return {
    screen: { type: 'title-menu', selectedItemIndex: 1 },
  }
}
