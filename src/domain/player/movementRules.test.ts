import { describe, expect, test } from 'vitest'
import {
  AIR_ACCELERATION,
  DEFAULT_DRAG_X,
  GROUND_ACCELERATION,
  ICE_GROUND_ACCELERATION,
  ICE_IDLE_DRAG_X,
  LANDING_FOOTSTEP_DELAY_MS,
  RUNNING_FOOTSTEP_INTERVAL_MS,
  RUNNING_FOOTSTEP_MIN_SPEED_X,
  getHorizontalMovementDecision,
  getMovementFootstepDecision,
  getPlayerControlFlowDecision,
} from './movementRules'

describe('getHorizontalMovementDecision', () => {
  test('keeps horizontal movement constants explicit', () => {
    expect(GROUND_ACCELERATION).toBe(950)
    expect(AIR_ACCELERATION).toBe(720)
    expect(ICE_GROUND_ACCELERATION).toBe(520)
    expect(ICE_IDLE_DRAG_X).toBe(36)
    expect(DEFAULT_DRAG_X).toBe(1500)
  })

  test('uses normal grounded acceleration when moving on ground', () => {
    expect(getHorizontalMovementDecision({
      left: false,
      right: true,
      grounded: true,
      crouching: false,
      onIce: false,
    })).toEqual({
      accelerationX: GROUND_ACCELERATION,
      dragX: DEFAULT_DRAG_X,
      stopVelocityX: false,
      direction: 'right',
    })
  })

  test('uses air acceleration when airborne', () => {
    expect(getHorizontalMovementDecision({
      left: true,
      right: false,
      grounded: false,
      crouching: false,
      onIce: false,
    })).toEqual({
      accelerationX: -AIR_ACCELERATION,
      dragX: DEFAULT_DRAG_X,
      stopVelocityX: false,
      direction: 'left',
    })
  })

  test('uses ice acceleration when grounded on ice', () => {
    expect(getHorizontalMovementDecision({
      left: false,
      right: true,
      grounded: true,
      crouching: false,
      onIce: true,
    })).toMatchObject({
      accelerationX: ICE_GROUND_ACCELERATION,
      dragX: DEFAULT_DRAG_X,
      direction: 'right',
    })
  })

  test('uses ice idle drag only when no horizontal input is held on ice', () => {
    expect(getHorizontalMovementDecision({
      left: false,
      right: false,
      grounded: true,
      crouching: false,
      onIce: true,
    })).toEqual({
      accelerationX: 0,
      dragX: ICE_IDLE_DRAG_X,
      stopVelocityX: false,
      direction: 'none',
    })
  })

  test('crouching stops movement on non-ice ground', () => {
    expect(getHorizontalMovementDecision({
      left: true,
      right: false,
      grounded: true,
      crouching: true,
      onIce: false,
    })).toEqual({
      accelerationX: 0,
      dragX: DEFAULT_DRAG_X,
      stopVelocityX: true,
      direction: 'none',
    })
  })

  test('crouching on ice does not stop horizontal velocity', () => {
    expect(getHorizontalMovementDecision({
      left: false,
      right: false,
      grounded: true,
      crouching: true,
      onIce: true,
    })).toEqual({
      accelerationX: 0,
      dragX: ICE_IDLE_DRAG_X,
      stopVelocityX: false,
      direction: 'none',
    })
  })

  test('left input takes priority when left and right are both held', () => {
    expect(getHorizontalMovementDecision({
      left: true,
      right: true,
      grounded: true,
      crouching: false,
      onIce: false,
    })).toEqual({
      accelerationX: -GROUND_ACCELERATION,
      dragX: DEFAULT_DRAG_X,
      stopVelocityX: false,
      direction: 'left',
    })
  })
})

describe('getMovementFootstepDecision', () => {
  test('keeps movement footstep constants explicit', () => {
    expect(LANDING_FOOTSTEP_DELAY_MS).toBe(180)
    expect(RUNNING_FOOTSTEP_INTERVAL_MS).toBe(270)
    expect(RUNNING_FOOTSTEP_MIN_SPEED_X).toBe(80)
  })

  test('plays landing footstep when newly grounded', () => {
    expect(getMovementFootstepDecision({
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

  test('plays running footstep when grounded moving fast enough after cooldown', () => {
    expect(getMovementFootstepDecision({
      now: 1000,
      grounded: true,
      wasGrounded: true,
      moving: true,
      velocityX: 81,
      nextFootstepAt: 1000,
    })).toEqual({
      playSfx: true,
      nextFootstepAt: 1270,
      wasGrounded: true,
    })
  })

  test('uses absolute horizontal velocity for running footstep threshold', () => {
    expect(getMovementFootstepDecision({
      now: 1000,
      grounded: true,
      wasGrounded: true,
      moving: true,
      velocityX: -81,
      nextFootstepAt: 999,
    }).playSfx).toBe(true)
  })

  test('does not play running footstep on exact speed boundary', () => {
    expect(getMovementFootstepDecision({
      now: 1000,
      grounded: true,
      wasGrounded: true,
      moving: true,
      velocityX: 80,
      nextFootstepAt: 1000,
    })).toEqual({
      playSfx: false,
      nextFootstepAt: 1000,
      wasGrounded: true,
    })
  })

  test('does not play running footstep before cooldown', () => {
    expect(getMovementFootstepDecision({
      now: 999,
      grounded: true,
      wasGrounded: true,
      moving: true,
      velocityX: 100,
      nextFootstepAt: 1000,
    })).toEqual({
      playSfx: false,
      nextFootstepAt: 1000,
      wasGrounded: true,
    })
  })

  test('does not play movement footstep while airborne but updates wasGrounded', () => {
    expect(getMovementFootstepDecision({
      now: 1000,
      grounded: false,
      wasGrounded: true,
      moving: true,
      velocityX: 200,
      nextFootstepAt: 300,
    })).toEqual({
      playSfx: false,
      nextFootstepAt: 300,
      wasGrounded: false,
    })
  })

  test('landing delay prevents immediate running footstep in the same frame', () => {
    expect(getMovementFootstepDecision({
      now: 1000,
      grounded: true,
      wasGrounded: false,
      moving: true,
      velocityX: 120,
      nextFootstepAt: 0,
    })).toEqual({
      playSfx: true,
      nextFootstepAt: 1180,
      wasGrounded: true,
    })
  })
})

describe('getPlayerControlFlowDecision', () => {
  test('continues player control when alive before stage clear', () => {
    expect(getPlayerControlFlowDecision({
      dead: false,
      stageCleared: false,
    })).toBe('active')
  })

  test('stops player control after death', () => {
    expect(getPlayerControlFlowDecision({
      dead: true,
      stageCleared: false,
    })).toBe('dead')
  })

  test('stops player control after stage clear', () => {
    expect(getPlayerControlFlowDecision({
      dead: false,
      stageCleared: true,
    })).toBe('stage-cleared')
  })

  test('prioritizes death over stage clear', () => {
    expect(getPlayerControlFlowDecision({
      dead: true,
      stageCleared: true,
    })).toBe('dead')
  })
})
