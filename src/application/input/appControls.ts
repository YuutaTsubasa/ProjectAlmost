import {
  activateTitleMenuItem,
  backFromSettings,
  backFromStageSelect,
  backFromWorldSelect,
  cancelDeleteConfirm,
  confirmSelectedStage,
  confirmSelectedWorld,
  createInitialAppState,
  moveStageSelection,
  moveSettingsDeleteConfirmSelection,
  moveSettingsScreenSelection,
  moveTitleMenuSelection,
  moveWorldSelection,
  openSettingsDeleteConfirm,
  openTitleMenu,
  type AppState,
} from '../../domain/app/appFlow'
import { projectData } from '../../domain/data/projectData'
import type { ControlIntent } from '../../domain/input/controlIntents'
import { adjustSettingsRow, resetSettings, type GameSettings } from '../../domain/settings/settings'

export type SettingsStateCarrier = AppState & {
  settings?: GameSettings
}

export function applyControlIntent(state: SettingsStateCarrier, intent: ControlIntent): SettingsStateCarrier {
  if (state.screen.type === 'title-intro') {
    return intent === 'open' ? openTitleMenu(state) : state
  }

  if (state.screen.type === 'title-menu') {
    if (intent === 'move-up') return moveTitleMenuSelection(state, -1)
    if (intent === 'move-down') return moveTitleMenuSelection(state, 1)
    if (intent === 'confirm') return activateTitleMenuItem(state)
    if (intent === 'back') return createInitialAppState()
    return state
  }

  if (state.screen.type === 'settings') {
    const currentSettings = (state as SettingsStateCarrier).settings
    const withSettings = (nextState: AppState): SettingsStateCarrier =>
      currentSettings ? { ...nextState, settings: currentSettings } : nextState

    if (state.screen.deleteConfirm) {
      if (intent === 'move-left') return withSettings(moveSettingsDeleteConfirmSelection(state, -1))
      if (intent === 'move-right') return withSettings(moveSettingsDeleteConfirmSelection(state, 1))
      if (intent === 'back') return withSettings(cancelDeleteConfirm(state))
      if (intent === 'confirm') return withSettings(cancelDeleteConfirm(state))
      return state
    }

    if (intent === 'move-up') return withSettings(moveSettingsScreenSelection(state, -1))
    if (intent === 'move-down') return withSettings(moveSettingsScreenSelection(state, 1))
    if ((intent === 'move-left' || intent === 'move-right') && currentSettings) {
      return {
        ...state,
        settings: adjustSettingsRow(
          currentSettings,
          state.screen.selectedItemIndex,
          intent === 'move-left' ? -1 : 1,
          projectData.localize.languages.map((language) => language.code),
        ),
      }
    }
    if (intent === 'confirm') {
      if (state.screen.selectedItemIndex === 7 && currentSettings) {
        return { ...state, settings: resetSettings(currentSettings.fullscreen) }
      }
      if (state.screen.selectedItemIndex === 8) return withSettings(openSettingsDeleteConfirm(state))
      if (state.screen.selectedItemIndex === 9) return withSettings(backFromSettings(state))
      if (currentSettings) {
        return {
          ...state,
          settings: adjustSettingsRow(
            currentSettings,
            state.screen.selectedItemIndex,
            1,
            projectData.localize.languages.map((language) => language.code),
          ),
        }
      }
    }
    if (intent === 'back') return withSettings(backFromSettings(state))
    return state
  }

  if (state.screen.type === 'stage-select') {
    if (intent === 'move-right' || intent === 'move-down') return moveStageSelection(state, 1)
    if (intent === 'move-left' || intent === 'move-up') return moveStageSelection(state, -1)
    if (intent === 'confirm') return confirmSelectedStage(state)
    if (intent === 'back') return backFromStageSelect(state)

    return state
  }

  if (intent === 'move-right' || intent === 'move-down') return moveWorldSelection(state, 1)
  if (intent === 'move-left' || intent === 'move-up') return moveWorldSelection(state, -1)
  if (intent === 'confirm') return confirmSelectedWorld(state)
  if (intent === 'back') return backFromWorldSelect(state)

  return state
}
