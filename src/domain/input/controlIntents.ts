export type ControlIntent = 'open' | 'move-up' | 'move-down' | 'confirm' | 'back'

export type ControlContext = 'title-intro' | 'title-menu'

export type KeyboardControlDescriptor = {
  key: string
  repeat: boolean
}

export type GamepadControlSnapshot = {
  mapping: string
  buttons: boolean[]
  axes: number[]
}

const AXIS_THRESHOLD = 0.5
const SOUTH_BUTTON_INDEX = 0
const EAST_BUTTON_INDEX = 1
const DPAD_UP_BUTTON_INDEX = 12
const DPAD_DOWN_BUTTON_INDEX = 13
const LEFT_STICK_Y_AXIS_INDEX = 1

export function mapKeyboardControlIntent(
  descriptor: KeyboardControlDescriptor,
  context: ControlContext,
): ControlIntent | null {
  if (descriptor.repeat) return null
  if (context === 'title-intro') return 'open'

  const key = descriptor.key.toLowerCase()

  if (descriptor.key === 'ArrowUp' || key === 'w') return 'move-up'
  if (descriptor.key === 'ArrowDown' || key === 's') return 'move-down'
  if (descriptor.key === 'Enter' || descriptor.key === ' ') return 'confirm'
  if (descriptor.key === 'Escape') return 'back'

  return null
}

export function mapGamepadControlIntents(
  previous: GamepadControlSnapshot | null,
  current: GamepadControlSnapshot | null,
  context: ControlContext,
): ControlIntent[] {
  if (!current || !previous) return []
  if (current.mapping !== 'standard' || previous.mapping !== 'standard') return []

  const intents: ControlIntent[] = []

  if (pressedNow(previous, current, SOUTH_BUTTON_INDEX)) {
    intents.push(context === 'title-intro' ? 'open' : 'confirm')
  }

  if (pressedNow(previous, current, EAST_BUTTON_INDEX)) {
    intents.push('back')
  }

  if (pressedNow(previous, current, DPAD_UP_BUTTON_INDEX) || axisCrossed(previous, current, 'negative')) {
    intents.push('move-up')
  }

  if (pressedNow(previous, current, DPAD_DOWN_BUTTON_INDEX) || axisCrossed(previous, current, 'positive')) {
    intents.push('move-down')
  }

  return intents
}

function pressedNow(
  previous: GamepadControlSnapshot | null,
  current: GamepadControlSnapshot,
  buttonIndex: number,
): boolean {
  return current.buttons[buttonIndex] === true && previous?.buttons[buttonIndex] !== true
}

function axisCrossed(
  previous: GamepadControlSnapshot | null,
  current: GamepadControlSnapshot,
  direction: 'negative' | 'positive',
): boolean {
  const currentValue = current.axes[LEFT_STICK_Y_AXIS_INDEX] ?? 0
  const previousValue = previous?.axes[LEFT_STICK_Y_AXIS_INDEX] ?? 0

  if (direction === 'negative') {
    return currentValue < -AXIS_THRESHOLD && previousValue >= -AXIS_THRESHOLD
  }

  return currentValue > AXIS_THRESHOLD && previousValue <= AXIS_THRESHOLD
}
