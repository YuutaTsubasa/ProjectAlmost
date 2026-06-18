export const GROUND_ACCELERATION = 950
export const AIR_ACCELERATION = 720
export const ICE_GROUND_ACCELERATION = 520
export const ICE_IDLE_DRAG_X = 36
export const DEFAULT_DRAG_X = 1500
export const LANDING_FOOTSTEP_DELAY_MS = 180
export const RUNNING_FOOTSTEP_INTERVAL_MS = 270
export const RUNNING_FOOTSTEP_MIN_SPEED_X = 80

export type HorizontalDirection = 'left' | 'right' | 'none'

export type HorizontalMovementDecision = {
  accelerationX: number
  dragX: number
  stopVelocityX: boolean
  direction: HorizontalDirection
}

export type MovementFootstepDecision = {
  playSfx: boolean
  nextFootstepAt: number
  wasGrounded: boolean
}

export type PlayerControlFlowDecision = 'active' | 'dead' | 'stage-cleared'

export function getPlayerControlFlowDecision(input: {
  dead: boolean
  stageCleared: boolean
}): PlayerControlFlowDecision {
  if (input.dead) return 'dead'
  if (input.stageCleared) return 'stage-cleared'
  return 'active'
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

export function getMovementFootstepDecision(input: {
  now: number
  grounded: boolean
  wasGrounded: boolean
  moving: boolean
  velocityX: number
  nextFootstepAt: number
}): MovementFootstepDecision {
  let playSfx = false
  let nextFootstepAt = input.nextFootstepAt

  if (input.grounded && !input.wasGrounded) {
    playSfx = true
    nextFootstepAt = input.now + LANDING_FOOTSTEP_DELAY_MS
  }

  if (
    input.grounded
    && input.moving
    && Math.abs(input.velocityX) > RUNNING_FOOTSTEP_MIN_SPEED_X
    && input.now >= nextFootstepAt
  ) {
    playSfx = true
    nextFootstepAt = input.now + RUNNING_FOOTSTEP_INTERVAL_MS
  }

  return {
    playSfx,
    nextFootstepAt,
    wasGrounded: input.grounded,
  }
}
