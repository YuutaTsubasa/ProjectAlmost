import {
  activateTitleMenuItem,
  backFromStageSelect,
  backFromWorldSelect,
  cancelDeleteConfirm,
  confirmSelectedStage,
  confirmSelectedWorld,
  createInitialAppState,
  moveStageSelection,
  moveTitleMenuSelection,
  moveWorldSelection,
  openTitleMenu,
  type AppState,
} from '../../domain/app/appFlow'
import { projectData } from '../../domain/data/projectData'
import type { ControlIntent } from '../../domain/input/controlIntents'
import type { GameSettings } from '../../domain/settings/settings'
import { applySettingsControlIntent } from './settingsControls'

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
    if (!currentSettings) return state

    const result = applySettingsControlIntent(
      { screen: state.screen, settings: currentSettings },
      intent,
      projectData.localize.languages.map((language) => language.code),
    )

    if (result.deleteConfirmed) {
      return {
        screen: cancelDeleteConfirm(result).screen,
        settings: result.settings,
      }
    }

    if (result.exitRequested) {
      return {
        screen: { type: 'title-menu', selectedItemIndex: 1 },
        settings: result.settings,
      }
    }

    return {
      screen: result.screen,
      settings: result.settings,
    }
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
