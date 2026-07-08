export const PAUSE_MENU_ITEMS = ['resume', 'restart-stage', 'settings', 'stage-select'] as const

export type PauseMenuItem = (typeof PAUSE_MENU_ITEMS)[number]

export type GameplayPauseState =
  | { mode: 'playing' }
  | { mode: 'paused'; selectedItemIndex: number }
  | { mode: 'settings'; selectedItemIndex: number }

export type PauseAction = 'resume' | 'restart-stage' | 'open-settings' | 'stage-select'

export type PauseActivation = {
  state: GameplayPauseState
  action: PauseAction | null
}

const SETTINGS_ITEM_INDEX = 2

function wrapIndex(index: number): number {
  return (index + PAUSE_MENU_ITEMS.length) % PAUSE_MENU_ITEMS.length
}

export function openPauseMenu(state: GameplayPauseState): GameplayPauseState {
  if (state.mode !== 'playing') return state

  return { mode: 'paused', selectedItemIndex: 0 }
}

export function resumePauseMenu(_state: GameplayPauseState): GameplayPauseState {
  return { mode: 'playing' }
}

export function movePauseMenuSelection(
  state: GameplayPauseState,
  direction: -1 | 1,
): GameplayPauseState {
  if (state.mode !== 'paused') return state

  return {
    mode: 'paused',
    selectedItemIndex: wrapIndex(state.selectedItemIndex + direction),
  }
}

export function selectPauseMenuItem(
  state: GameplayPauseState,
  selectedItemIndex: number,
): GameplayPauseState {
  if (state.mode !== 'paused') return state
  if (selectedItemIndex < 0 || selectedItemIndex >= PAUSE_MENU_ITEMS.length) return state

  return { mode: 'paused', selectedItemIndex }
}

export function openPauseSettings(state: GameplayPauseState): GameplayPauseState {
  if (state.mode !== 'paused') return state

  return { mode: 'settings', selectedItemIndex: SETTINGS_ITEM_INDEX }
}

export function backFromPauseSettings(state: GameplayPauseState): GameplayPauseState {
  if (state.mode !== 'settings') return state

  return { mode: 'paused', selectedItemIndex: SETTINGS_ITEM_INDEX }
}

export function activatePauseMenuItem(state: GameplayPauseState): PauseActivation {
  if (state.mode !== 'paused') return { state, action: null }

  const item = PAUSE_MENU_ITEMS[state.selectedItemIndex]
  if (item === 'resume') return { state: resumePauseMenu(state), action: 'resume' }
  if (item === 'restart-stage') return { state: resumePauseMenu(state), action: 'restart-stage' }
  if (item === 'settings') return { state: openPauseSettings(state), action: 'open-settings' }
  if (item === 'stage-select') return { state: resumePauseMenu(state), action: 'stage-select' }

  return { state, action: null }
}
