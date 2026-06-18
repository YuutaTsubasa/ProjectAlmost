import {
  activateTitleMenuItem,
  moveTitleMenuSelection,
  openTitleMenu,
  selectTitleMenuItem,
  type AppState,
} from '../../domain/app/appFlow'
import type { ControlIntent } from '../../domain/input/controlIntents'

const BACK_ITEM_INDEX = 2

export function applyTitleControlIntent(state: AppState, intent: ControlIntent): AppState {
  if (intent === 'open') {
    return openTitleMenu(state)
  }

  if (state.screen.type !== 'title-menu') {
    return state
  }

  if (intent === 'move-up') {
    return moveTitleMenuSelection(state, -1)
  }

  if (intent === 'move-down') {
    return moveTitleMenuSelection(state, 1)
  }

  if (intent === 'confirm') {
    return activateTitleMenuItem(state)
  }

  if (intent === 'back') {
    return activateTitleMenuItem(selectTitleMenuItem(state, BACK_ITEM_INDEX))
  }

  return state
}

export function selectTitleMenuItemFromPointer(state: AppState, selectedItemIndex: number): AppState {
  const selectedState = selectTitleMenuItem(state, selectedItemIndex)
  if (selectedState.screen.type !== 'title-menu') {
    return selectedState
  }

  if (selectedItemIndex !== BACK_ITEM_INDEX) {
    return selectedState
  }

  return activateTitleMenuItem(selectedState)
}
