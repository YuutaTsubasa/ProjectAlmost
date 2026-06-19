import type { AppScreen } from '../../domain/app/appFlow'
import type { UiSfxAction } from '../../domain/audio/audioPolicy'
import type { ControlIntent } from '../../domain/input/controlIntents'

export function getControlIntentSfxAction(
  previousScreen: AppScreen,
  nextScreen: AppScreen,
  intent: ControlIntent,
): UiSfxAction | null {
  if (intent === 'back') return 'back'
  if (intent === 'open' && previousScreen.type === 'title-intro' && nextScreen.type === 'title-menu') {
    return 'confirm'
  }
  if (intent === 'confirm') return 'confirm'
  if (intent.startsWith('move-') && selectedPositionChanged(previousScreen, nextScreen)) {
    return 'move'
  }

  return null
}

function selectedPositionChanged(previousScreen: AppScreen, nextScreen: AppScreen): boolean {
  if (previousScreen.type !== nextScreen.type) return false

  if (previousScreen.type === 'title-menu' && nextScreen.type === 'title-menu') {
    return previousScreen.selectedItemIndex !== nextScreen.selectedItemIndex
  }

  if (previousScreen.type === 'world-select' && nextScreen.type === 'world-select') {
    return previousScreen.selectedWorldIndex !== nextScreen.selectedWorldIndex
  }

  if (previousScreen.type === 'settings' && nextScreen.type === 'settings') {
    const previousDeleteIndex = previousScreen.deleteConfirm?.selectedActionIndex
    const nextDeleteIndex = nextScreen.deleteConfirm?.selectedActionIndex

    return (
      previousScreen.selectedItemIndex !== nextScreen.selectedItemIndex ||
      previousDeleteIndex !== nextDeleteIndex
    )
  }

  return false
}
