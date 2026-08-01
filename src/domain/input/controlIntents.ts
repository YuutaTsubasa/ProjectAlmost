export type ControlIntent =
  | 'open'
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'confirm'
  | 'back'

export type ControlContext =
  | 'title-intro'
  | 'title-menu'
  | 'world-select'
  | 'stage-select'
  | 'settings'
  | 'settings-delete-confirm'
  | 'gameplay-active'
  | 'gameplay-pause-menu'

export type KeyboardControlDescriptor = {
  key: string
  repeat: boolean
}

export type GamepadControlSnapshot = {
  mapping: string
  buttons: boolean[]
  axes: number[]
}

const KEYBOARD_INTENT_KEYS: readonly { intent: ControlIntent; keys: readonly string[] }[] = [
  { intent: 'move-up', keys: ['arrowup', 'w'] },
  { intent: 'move-down', keys: ['arrowdown', 's'] },
  { intent: 'move-left', keys: ['arrowleft', 'a'] },
  { intent: 'move-right', keys: ['arrowright', 'd'] },
  { intent: 'confirm', keys: ['enter', ' '] },
  { intent: 'back', keys: ['escape'] },
]

const CONTEXT_INTENTS: Record<ControlContext, readonly ControlIntent[]> = {
  'title-intro': [],
  'title-menu': ['move-up', 'move-down', 'confirm', 'back'],
  'world-select': ['move-up', 'move-down', 'move-left', 'move-right', 'confirm', 'back'],
  'stage-select': ['move-up', 'move-down', 'move-left', 'move-right', 'confirm', 'back'],
  settings: ['move-up', 'move-down', 'move-left', 'move-right', 'confirm', 'back'],
  'settings-delete-confirm': ['move-left', 'move-right', 'confirm', 'back'],
  'gameplay-active': ['back'],
  'gameplay-pause-menu': ['move-up', 'move-down', 'confirm', 'back'],
}

const AXIS_THRESHOLD = 0.5
const SOUTH_BUTTON_INDEX = 0
const EAST_BUTTON_INDEX = 1
const DPAD_UP_BUTTON_INDEX = 12
const DPAD_DOWN_BUTTON_INDEX = 13
const DPAD_LEFT_BUTTON_INDEX = 14
const DPAD_RIGHT_BUTTON_INDEX = 15
const LEFT_STICK_X_AXIS_INDEX = 0
const LEFT_STICK_Y_AXIS_INDEX = 1

export function mapKeyboardControlIntent(
  descriptor: KeyboardControlDescriptor,
  context: ControlContext,
): ControlIntent | null {
  if (descriptor.repeat) return null
  if (context === 'title-intro') return 'open'

  const key = descriptor.key.toLowerCase()
  const allowedIntents = CONTEXT_INTENTS[context]

  if (context === 'gameplay-active' && key === 'p') return 'back'

  const match = KEYBOARD_INTENT_KEYS.find(
    (entry) => allowedIntents.includes(entry.intent) && entry.keys.includes(key),
  )

  return match?.intent ?? null
}

export function mapGamepadControlIntents(
  previous: GamepadControlSnapshot | null,
  current: GamepadControlSnapshot | null,
  context: ControlContext,
): ControlIntent[] {
  if (!current || !previous) return []
  if (current.mapping !== 'standard' || previous.mapping !== 'standard') return []

  if (context === 'gameplay-active') {
    return pressedNow(previous, current, EAST_BUTTON_INDEX) ? ['back'] : []
  }

  const intents: ControlIntent[] = []

  if (pressedNow(previous, current, SOUTH_BUTTON_INDEX)) {
    intents.push(context === 'title-intro' ? 'open' : 'confirm')
  }

  if (pressedNow(previous, current, EAST_BUTTON_INDEX)) {
    intents.push('back')
  }

  if (pressedNow(previous, current, DPAD_UP_BUTTON_INDEX)) {
    intents.push('move-up')
  }

  if (pressedNow(previous, current, DPAD_DOWN_BUTTON_INDEX)) {
    intents.push('move-down')
  }

  if (pressedNow(previous, current, DPAD_LEFT_BUTTON_INDEX)) {
    intents.push('move-left')
  }

  if (pressedNow(previous, current, DPAD_RIGHT_BUTTON_INDEX)) {
    intents.push('move-right')
  }

  if (axisCrossed(previous, current, LEFT_STICK_Y_AXIS_INDEX, -1)) {
    intents.push('move-up')
  }

  if (axisCrossed(previous, current, LEFT_STICK_Y_AXIS_INDEX, 1)) {
    intents.push('move-down')
  }

  if (axisCrossed(previous, current, LEFT_STICK_X_AXIS_INDEX, -1)) {
    intents.push('move-left')
  }

  if (axisCrossed(previous, current, LEFT_STICK_X_AXIS_INDEX, 1)) {
    intents.push('move-right')
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
  axisIndex: number,
  direction: -1 | 1,
): boolean {
  const currentValue = current.axes[axisIndex] ?? 0
  const previousValue = previous?.axes[axisIndex] ?? 0

  if (direction === -1) {
    return currentValue < -AXIS_THRESHOLD && previousValue >= -AXIS_THRESHOLD
  }

  return currentValue > AXIS_THRESHOLD && previousValue <= AXIS_THRESHOLD
}
