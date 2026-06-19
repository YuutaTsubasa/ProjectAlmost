import {
  activateTitleMenuItem,
  backFromWorldSelect,
  confirmSelectedWorld,
  createInitialAppState,
  moveTitleMenuSelection,
  moveWorldSelection,
  openTitleMenu,
  type AppState,
} from '../../domain/app/appFlow'
import type { ControlIntent } from '../../domain/input/controlIntents'

export function applyControlIntent(state: AppState, intent: ControlIntent): AppState {
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

  if (intent === 'move-right' || intent === 'move-down') return moveWorldSelection(state, 1)
  if (intent === 'move-left' || intent === 'move-up') return moveWorldSelection(state, -1)
  if (intent === 'confirm') return confirmSelectedWorld(state)
  if (intent === 'back') return backFromWorldSelect(state)

  return state
}
