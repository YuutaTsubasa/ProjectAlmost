import {
  cancelDeleteConfirm,
  moveSettingsDeleteConfirmSelection,
  moveSettingsScreenSelection,
  openSettingsDeleteConfirm,
  type AppState,
  type SettingsScreen,
} from '../../domain/app/appFlow'
import type { LocaleCode } from '../../domain/data/localize/localize'
import type { ControlIntent } from '../../domain/input/controlIntents'
import { adjustSettingsRow, resetSettings, type GameSettings } from '../../domain/settings/settings'

export type SettingsControlState = {
  screen: SettingsScreen
  settings: GameSettings
}

export type SettingsControlResult = SettingsControlState & {
  exitRequested: boolean
  fullscreenChanged: boolean
  deleteConfirmed: boolean
}

function nextSettingsScreen(state: AppState): SettingsScreen {
  return state.screen as SettingsScreen
}

export function applySettingsControlIntent(
  state: SettingsControlState,
  intent: ControlIntent,
  localeCodes: readonly LocaleCode[],
): SettingsControlResult {
  if (state.screen.deleteConfirm) {
    if (intent === 'move-left' || intent === 'move-right') {
      return {
        ...state,
        screen: nextSettingsScreen(moveSettingsDeleteConfirmSelection(state, intent === 'move-left' ? -1 : 1)),
        exitRequested: false,
        fullscreenChanged: false,
        deleteConfirmed: false,
      }
    }

    if (intent === 'back') {
      return {
        ...state,
        screen: nextSettingsScreen(cancelDeleteConfirm(state)),
        exitRequested: false,
        fullscreenChanged: false,
        deleteConfirmed: false,
      }
    }

    if (intent === 'confirm') {
      const deleteConfirmed = state.screen.deleteConfirm.selectedActionIndex === 1

      return {
        ...state,
        screen: nextSettingsScreen(cancelDeleteConfirm(state)),
        exitRequested: false,
        fullscreenChanged: false,
        deleteConfirmed,
      }
    }

    return {
      ...state,
      exitRequested: false,
      fullscreenChanged: false,
      deleteConfirmed: false,
    }
  }

  if (intent === 'move-up' || intent === 'move-down') {
    return {
      ...state,
      screen: nextSettingsScreen(moveSettingsScreenSelection(state, intent === 'move-up' ? -1 : 1)),
      exitRequested: false,
      fullscreenChanged: false,
      deleteConfirmed: false,
    }
  }

  if (intent === 'move-left' || intent === 'move-right') {
    const settings = adjustSettingsRow(
      state.settings,
      state.screen.selectedItemIndex,
      intent === 'move-left' ? -1 : 1,
      localeCodes,
    )

    return {
      ...state,
      settings,
      exitRequested: false,
      fullscreenChanged: settings.fullscreen !== state.settings.fullscreen,
      deleteConfirmed: false,
    }
  }

  if (intent === 'confirm') {
    if (state.screen.selectedItemIndex === 7) {
      const settings = resetSettings(state.settings.fullscreen)

      return {
        ...state,
        settings,
        exitRequested: false,
        fullscreenChanged: settings.fullscreen !== state.settings.fullscreen,
        deleteConfirmed: false,
      }
    }

    if (state.screen.selectedItemIndex === 8) {
      return {
        ...state,
        screen: nextSettingsScreen(openSettingsDeleteConfirm(state)),
        exitRequested: false,
        fullscreenChanged: false,
        deleteConfirmed: false,
      }
    }

    if (state.screen.selectedItemIndex === 9) {
      return {
        ...state,
        exitRequested: true,
        fullscreenChanged: false,
        deleteConfirmed: false,
      }
    }

    const settings = adjustSettingsRow(state.settings, state.screen.selectedItemIndex, 1, localeCodes)

    return {
      ...state,
      settings,
      exitRequested: false,
      fullscreenChanged: settings.fullscreen !== state.settings.fullscreen,
      deleteConfirmed: false,
    }
  }

  if (intent === 'back') {
    return {
      ...state,
      exitRequested: true,
      fullscreenChanged: false,
      deleteConfirmed: false,
    }
  }

  return {
    ...state,
    exitRequested: false,
    fullscreenChanged: false,
    deleteConfirmed: false,
  }
}
