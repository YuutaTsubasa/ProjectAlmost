export const GROUND_ACCELERATION = 950
export const AIR_ACCELERATION = 720
export const ICE_GROUND_ACCELERATION = 520
export const ICE_IDLE_DRAG_X = 36
export const DEFAULT_DRAG_X = 1500

export type HorizontalDirection = 'left' | 'right' | 'none'

export type HorizontalMovementDecision = {
  accelerationX: number
  dragX: number
  stopVelocityX: boolean
  direction: HorizontalDirection
}

export function getHorizontalMovementDecision(input: {
  left: boolean
  right: boolean
  grounded: boolean
  crouching: boolean
  onIce: boolean
}): HorizontalMovementDecision {
  const dragX = input.onIce && !input.left && !input.right ? ICE_IDLE_DRAG_X : DEFAULT_DRAG_X
  if (input.crouching) {
    return {
      accelerationX: 0,
      dragX,
      stopVelocityX: !input.onIce,
      direction: 'none',
    }
  }
  const groundedAcceleration = input.onIce ? ICE_GROUND_ACCELERATION : GROUND_ACCELERATION
  const acceleration = input.grounded ? groundedAcceleration : AIR_ACCELERATION
  if (input.left) {
    return {
      accelerationX: -acceleration,
      dragX,
      stopVelocityX: false,
      direction: 'left',
    }
  }
  if (input.right) {
    return {
      accelerationX: acceleration,
      dragX,
      stopVelocityX: false,
      direction: 'right',
    }
  }
  return {
    accelerationX: 0,
    dragX,
    stopVelocityX: false,
    direction: 'none',
  }
}
