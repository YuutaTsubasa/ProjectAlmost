export type GameplayInputSnapshot = {
  leftHeld: boolean
  rightHeld: boolean
  crouchHeld: boolean
  jumpPressed: boolean
  jumpHeld: boolean
  attackPressed: boolean
  attackHeld: boolean
  pausePressed: boolean
}

export type VirtualControlsState = {
  visible: boolean
  moveX: -1 | 0 | 1
  crouchHeld: boolean
}

export type VirtualStickInput = {
  moveX: -1 | 0 | 1
  crouchHeld: boolean
  knob: { x: number; y: number }
}

export type GameplayInputSource = 'none' | 'virtual-pointer' | 'keyboard' | 'gamepad'

export type GamepadGameplaySnapshot = {
  mapping: string
  buttons: readonly boolean[]
  axes: readonly number[]
}

export const emptyGameplayInputSnapshot: GameplayInputSnapshot = {
  leftHeld: false,
  rightHeld: false,
  crouchHeld: false,
  jumpPressed: false,
  jumpHeld: false,
  attackPressed: false,
  attackHeld: false,
  pausePressed: false,
}

const STICK_MOVE_THRESHOLD = 0.28
const STICK_CROUCH_THRESHOLD = 0.55
const GAMEPAD_AXIS_THRESHOLD = 0.35
const SOUTH_BUTTON_INDEX = 0
const EAST_BUTTON_INDEX = 1
const WEST_BUTTON_INDEX = 2
const DPAD_DOWN_BUTTON_INDEX = 13
const DPAD_LEFT_BUTTON_INDEX = 14
const DPAD_RIGHT_BUTTON_INDEX = 15
const LEFT_STICK_X_AXIS_INDEX = 0
const LEFT_STICK_Y_AXIS_INDEX = 1

export function getVirtualStickInput(input: { x: number; y: number; radius: number }): VirtualStickInput {
  const radius = Math.max(1, input.radius)
  const length = Math.hypot(input.x, input.y)
  const scale = length > radius ? radius / length : 1
  const normalizedX = input.x / radius
  const normalizedY = input.y / radius
  const moveX = Math.abs(normalizedX) > STICK_MOVE_THRESHOLD
    ? (Math.sign(normalizedX) as -1 | 1)
    : 0

  return {
    moveX,
    crouchHeld: normalizedY > STICK_CROUCH_THRESHOLD,
    knob: {
      x: input.x * scale,
      y: input.y * scale,
    },
  }
}

export function clearVirtualControlsState(_state: VirtualControlsState): VirtualControlsState {
  return {
    visible: false,
    moveX: 0,
    crouchHeld: false,
  }
}

export function getVirtualControlsVisibilityDecision(input: {
  visible: boolean
  source: GameplayInputSource
  playable: boolean
}): { visible: boolean; resetVirtualState: boolean } {
  if (!input.playable) return { visible: false, resetVirtualState: true }
  if (input.source === 'virtual-pointer') return { visible: true, resetVirtualState: false }
  if (input.source === 'keyboard' || input.source === 'gamepad') {
    return { visible: false, resetVirtualState: input.visible }
  }

  return { visible: input.visible, resetVirtualState: false }
}

export function mergeGameplayInputSnapshots(inputs: readonly Partial<GameplayInputSnapshot>[]): GameplayInputSnapshot {
  return inputs.reduce<GameplayInputSnapshot>(
    (merged, input) => ({
      leftHeld: merged.leftHeld || input.leftHeld === true,
      rightHeld: merged.rightHeld || input.rightHeld === true,
      crouchHeld: merged.crouchHeld || input.crouchHeld === true,
      jumpPressed: merged.jumpPressed || input.jumpPressed === true,
      jumpHeld: merged.jumpHeld || input.jumpHeld === true,
      attackPressed: merged.attackPressed || input.attackPressed === true,
      attackHeld: merged.attackHeld || input.attackHeld === true,
      pausePressed: merged.pausePressed || input.pausePressed === true,
    }),
    { ...emptyGameplayInputSnapshot },
  )
}

export function mapGamepadGameplayInputSnapshot(
  previous: GamepadGameplaySnapshot | null,
  current: GamepadGameplaySnapshot | null,
): GameplayInputSnapshot {
  if (!current || current.mapping !== 'standard') return emptyGameplayInputSnapshot
  if (previous && previous.mapping !== 'standard') return emptyGameplayInputSnapshot

  const axisX = current.axes[LEFT_STICK_X_AXIS_INDEX] ?? 0
  const axisY = current.axes[LEFT_STICK_Y_AXIS_INDEX] ?? 0
  const jumpHeld = current.buttons[SOUTH_BUTTON_INDEX] === true
  const pauseHeld = current.buttons[EAST_BUTTON_INDEX] === true
  const attackHeld = current.buttons[WEST_BUTTON_INDEX] === true

  return {
    leftHeld: axisX < -GAMEPAD_AXIS_THRESHOLD || current.buttons[DPAD_LEFT_BUTTON_INDEX] === true,
    rightHeld: axisX > GAMEPAD_AXIS_THRESHOLD || current.buttons[DPAD_RIGHT_BUTTON_INDEX] === true,
    crouchHeld: axisY > GAMEPAD_AXIS_THRESHOLD || current.buttons[DPAD_DOWN_BUTTON_INDEX] === true,
    jumpPressed: jumpHeld && previous?.buttons[SOUTH_BUTTON_INDEX] !== true,
    jumpHeld,
    attackPressed: attackHeld && previous?.buttons[WEST_BUTTON_INDEX] !== true,
    attackHeld,
    pausePressed: pauseHeld && previous?.buttons[EAST_BUTTON_INDEX] !== true,
  }
}
