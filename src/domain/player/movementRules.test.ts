import { describe, expect, test } from 'vitest'
import {
  AIR_ACCELERATION,
  DEFAULT_DRAG_X,
  GROUND_ACCELERATION,
  ICE_GROUND_ACCELERATION,
  ICE_IDLE_DRAG_X,
  getHorizontalMovementDecision,
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
