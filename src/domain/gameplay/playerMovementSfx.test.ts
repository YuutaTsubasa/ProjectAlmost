import { describe, expect, it } from 'vitest'
import {
  LANDING_FOOTSTEP_DELAY_MS,
  RUNNING_FOOTSTEP_INTERVAL_MS,
  RUNNING_FOOTSTEP_MIN_SPEED_X,
  getPlayerMovementFootstepDecision,
} from './playerMovementSfx'

describe('getPlayerMovementFootstepDecision', () => {
  it('keeps movement footstep timing constants explicit', () => {
    expect(LANDING_FOOTSTEP_DELAY_MS).toBe(180)
    expect(RUNNING_FOOTSTEP_INTERVAL_MS).toBe(270)
    expect(RUNNING_FOOTSTEP_MIN_SPEED_X).toBe(80)
  })

  it('plays one landing footstep when player newly touches ground', () => {
    expect(getPlayerMovementFootstepDecision({
      now: 1000,
      grounded: true,
      wasGrounded: false,
      moving: false,
      velocityX: 0,
      nextFootstepAt: 0,
    })).toEqual({
      playSfx: true,
      nextFootstepAt: 1180,
      wasGrounded: true,
    })
  })

  it('plays running footstep only after cooldown while grounded and moving over speed threshold', () => {
    expect(getPlayerMovementFootstepDecision({
      now: 1000,
      grounded: true,
      wasGrounded: true,
      moving: true,
      velocityX: -81,
      nextFootstepAt: 1000,
    })).toEqual({
      playSfx: true,
      nextFootstepAt: 1270,
      wasGrounded: true,
    })
  })

  it('does not play while airborne or before running cooldown', () => {
    expect(getPlayerMovementFootstepDecision({
      now: 999,
      grounded: true,
      wasGrounded: true,
      moving: true,
      velocityX: 120,
      nextFootstepAt: 1000,
    })).toEqual({
      playSfx: false,
      nextFootstepAt: 1000,
      wasGrounded: true,
    })

    expect(getPlayerMovementFootstepDecision({
      now: 1000,
      grounded: false,
      wasGrounded: true,
      moving: true,
      velocityX: 120,
      nextFootstepAt: 1000,
    })).toEqual({
      playSfx: false,
      nextFootstepAt: 1000,
      wasGrounded: false,
    })
  })
})
