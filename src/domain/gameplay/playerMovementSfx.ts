export const LANDING_FOOTSTEP_DELAY_MS = 180
export const RUNNING_FOOTSTEP_INTERVAL_MS = 270
export const RUNNING_FOOTSTEP_MIN_SPEED_X = 80

export type PlayerMovementFootstepDecision = {
  playSfx: boolean
  nextFootstepAt: number
  wasGrounded: boolean
}

export function getPlayerMovementFootstepDecision(input: {
  now: number
  grounded: boolean
  wasGrounded: boolean
  moving: boolean
  velocityX: number
  nextFootstepAt: number
}): PlayerMovementFootstepDecision {
  if (!input.grounded) {
    return {
      playSfx: false,
      nextFootstepAt: input.nextFootstepAt,
      wasGrounded: false,
    }
  }

  if (!input.wasGrounded) {
    return {
      playSfx: true,
      nextFootstepAt: input.now + LANDING_FOOTSTEP_DELAY_MS,
      wasGrounded: true,
    }
  }

  const runningFootstepReady = input.moving
    && Math.abs(input.velocityX) > RUNNING_FOOTSTEP_MIN_SPEED_X
    && input.now >= input.nextFootstepAt

  return {
    playSfx: runningFootstepReady,
    nextFootstepAt: runningFootstepReady
      ? input.now + RUNNING_FOOTSTEP_INTERVAL_MS
      : input.nextFootstepAt,
    wasGrounded: true,
  }
}
