import {
  moveDeleteConfirmSelection,
  moveSettingsSelection,
  openDeleteConfirm,
  type DeleteConfirmState,
} from '../settings/settings'
import type { StageId, WorldId } from '../data/worlds/worldTypes'
import {
  STAGES_PER_WORLD,
  WORLD_COUNT,
  formatStageId,
  parseStageId,
  worldIdFromNumber,
} from '../data/worlds/stageId'

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

export type StageSelectScreen = {
  type: 'stage-select'
  selectedWorldIndex: number
  worldId: WorldId
  selectedStageIndex: number
}

export type GameplayScreen = {
  type: 'gameplay'
  stageId: StageId
  runId: number
}

export type SettingsScreen = {
  type: 'settings'
  selectedItemIndex: number
  deleteConfirm: DeleteConfirmState | null
}

export type AppScreen =
  | { type: 'title-intro' }
  | TitleMenuScreen
  | WorldSelectScreen
  | StageSelectScreen
  | GameplayScreen
  | SettingsScreen

export type AppState = {
  screen: AppScreen
}

function getStageIdForSelection(screen: StageSelectScreen): StageId {
  return formatStageId(screen.selectedWorldIndex + 1, screen.selectedStageIndex + 1)
}

export type StageUnlockGuard = {
  isStageUnlocked?: (stageId: StageId) => boolean
}

function canOpenStage(stageId: StageId, guard: StageUnlockGuard | undefined): boolean {
  return guard?.isStageUnlocked ? guard.isStageUnlocked(stageId) : true
}

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

  return {
    screen: {
      type: 'stage-select',
      selectedWorldIndex: state.screen.selectedWorldIndex,
      worldId: worldIdFromNumber(state.screen.selectedWorldIndex + 1),
      selectedStageIndex: 0,
    },
  }
}

export function backFromWorldSelect(state: AppState): AppState {
  if (state.screen.type !== 'world-select') return state

  return {
    screen: { type: 'title-menu', selectedItemIndex: 0 },
  }
}

export function moveStageSelection(state: AppState, direction: -1 | 1): AppState {
  if (state.screen.type !== 'stage-select') return state

  const selectedStageIndex = (state.screen.selectedStageIndex + direction + STAGES_PER_WORLD) % STAGES_PER_WORLD

  return {
    screen: { ...state.screen, selectedStageIndex },
  }
}

export function selectStage(state: AppState, selectedStageIndex: number): AppState {
  if (state.screen.type !== 'stage-select') return state

  return {
    screen: { ...state.screen, selectedStageIndex },
  }
}

export function confirmSelectedStage(state: AppState, guard?: StageUnlockGuard): AppState {
  if (state.screen.type !== 'stage-select') return state

  const stageId = getStageIdForSelection(state.screen)
  if (!canOpenStage(stageId, guard)) return state

  return {
    screen: { type: 'gameplay', stageId, runId: 0 },
  }
}

export function openNextGameplayStage(
  state: AppState,
  nextStageId: StageId | null,
  guard?: StageUnlockGuard,
): AppState {
  if (state.screen.type !== 'gameplay' || !nextStageId) return state
  if (!canOpenStage(nextStageId, guard)) return state

  return {
    screen: { type: 'gameplay', stageId: nextStageId, runId: state.screen.runId + 1 },
  }
}

function getStageSelectionForStageId(stageId: StageId): StageSelectScreen {
  const { worldNumber, stageNumber } = parseStageId(stageId)
  const selectedWorldIndex = Math.max(0, worldNumber - 1)
  const selectedStageIndex = Math.max(0, stageNumber - 1)

  return {
    type: 'stage-select',
    selectedWorldIndex,
    worldId: worldIdFromNumber(selectedWorldIndex + 1),
    selectedStageIndex,
  }
}

export function getGameplayScreenKey(screen: GameplayScreen): string {
  return `${screen.stageId}:${screen.runId}`
}

export function backFromStageSelect(state: AppState): AppState {
  if (state.screen.type !== 'stage-select') return state

  return {
    screen: { type: 'world-select', selectedWorldIndex: state.screen.selectedWorldIndex },
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

export function retryGameplayStage(state: AppState): AppState {
  if (state.screen.type !== 'gameplay') return state

  return {
    screen: {
      ...state.screen,
      runId: state.screen.runId + 1,
    },
  }
}

export function returnFromGameplayToStageSelect(state: AppState): AppState {
  if (state.screen.type !== 'gameplay') return state

  return {
    screen: getStageSelectionForStageId(state.screen.stageId),
  }
}
